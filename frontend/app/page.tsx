"use client";
import { useState, useRef, useEffect } from "react";
import Editor from "@/components/editor";
import UserList from "@/components/userlist";
import { useCollabSocket } from "@/components/useCollabSocket";

const GLOBE_FRAMES = [
  `              _-o#&&*''''?d:>b\\_
          _o/\`''  '',, dMF9MMMMMHo_
       .o&#'        \`"MbHMMMMMMMMMMMHo.
     .o"" '         vodM*$&&HMMMMMMMMMM?.
    ,'              $M&ood,~'\`(&##MMMMMMH\\
   /               ,MMMMMMM#b?#bobMMMMHMMML
  &              ?MMMMMMMMMMMMMMMMM7MMM$R*Hk
 ?$.            :MMMMMMMMMMMMMMMMMMM/HMMM|\`*L
|               |MMMMMMMMMMMMMMMMMMMMbMH'   T,
$H#:            \`*MMMMMMMMMMMMMMMMMMMMb#}'  \`?
]MMH#             ""*""""*#MMMMMMMMMMMMM'    -
MMMMMb_                   |MMMMMMMMMMMP'     :
HMMMMMMMHo                 \`MMMMMMMMMT       .
?MMMMMMMMP                  9MMMMMMMM}       -
-?MMMMMMM                  |MMMMMMMMM?,d-    '
 :|MMMMMM-                 \`MMMMMMMT .M|.   :
  .9MMM[                    &MMMMM*' \`'    .
   :9MMk                    \`MMM#"        -
     &M}                     \`          .-
      \`&.                             .
        \`~,   .                     ./
            . _                  .-
              '\`--._,dd###pp=""'`,

  `              _v->#H#P? "':o<>\\_
          .,dP\` \`''  "'-o.+H6&MMMHo_
        oHMH9'         \`?&bHMHMMMMMMHo.
      oMP"' '           ooMP*#&HMMMMMMM?.
    ,M*          -     \`*MSdob//\`^&##MMMH\\
   d*'                .,MMMMMMH#o>#ooMMMMMb
  HM-                :HMMMMMMMMMMMMMMM&HM[R\\
 d"Z\\.               9MMMMMMMMMMMMMMMMM[HMM|:
-H    -              MMMMMMMMMMMMMMMMMMMbMP' :
:??Mb#               \`9MMMMMMMMMMMMMMMMMMH#! .
: MMMMH#,              "*""""\`#HMMMMMMMMMMH  -
||MMMMMM6\\.                    {MMMMMMMMMH'  :
:|MMMMMMMMMMHo                 \`9MMMMMMMM'   .
. HMMMMMMMMMMP'                 !MMMMMMMM    \`
- \`#MMMMMMMMM                   HMMMMMMM*,/  :
 :  ?MMMMMMMF                   HMMMMMM',P' :
  .  HMMMMR'                    {MMMMP' ^' -
   : \`HMMMT                     iMMH'     .'
    -..\`HMH                               .
      -:*H                            . '
        -\`\\,,    .                  .-
          ' .  _                 .-\`
              '\`~\\.__,obb#q==~'''`,

  `              .ovr:HMM#?:\`' >b\\_
          .,:&Hi' \`'   "' \\\\|&bSMHo_
        oHMMM#*}          \`?&dMMMMMMHo.
     .dMMMH"''''           ,oHH*&&9MMMM?.
    ,MMM*'                 \`*M\\bd<|"*&#MH\\
   dHH?'                   :MMMMMM#bd#odMML
  H' |\\                  \`dMMMMMMMMMMMMMM9Mk
 JL/"7+,.                \`MMMMMMMMMMMMMMMH9ML
-\`Hp     '               |MMMMMMMMMMMMMMMMHH|:
:  \\\\#M#d?                \`HMMMMMMMMMMMMMMMMH.
.   JMMMMM##,              \`\`*""'"*#MMMMMMMMH
-. ,MMMMMMMM6o_                    |MMMMMMMM':
:  |MMMMMMMMMMMMMb\\                 TMMMMMMT :
.   ?MMMMMMMMMMMMM'                 :MMMMMM|.\`
-    ?HMMMMMMMMMM:                  HMMMMMM\\|:
 :     9MMMMMMMMH'                 \`MMMMMP.P.
  .    \`MMMMMMT''                   HMMM*''-
   -    TMMMMM'                     MM*'  -
    '.   HMM#                            -
      -. \`9M:                          .'
        -. \`b,,    .                . '
          '-\\   .,               .-\`
              '-:b~\\\\_,oddq==--"`,
];

export default function Page() {
  const [code, setCode] = useState('fn main() {\n    println!("Hello!");\n}');
  const [users, setUsers] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);

  const isIncomingUpdate = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % GLOBE_FRAMES.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { sendEdit } = useCollabSocket({
    user: username,
    room: "room1",
    onSnapshot: (content) => {
      isIncomingUpdate.current = true;
      setCode(content);
      setTimeout(() => {
        isIncomingUpdate.current = false;
      }, 0);
    },
    onEdit: (content) => {
      isIncomingUpdate.current = true;
      setCode(content);
      setTimeout(() => {
        isIncomingUpdate.current = false;
      }, 0);
    },
    onUserJoin: (u) => setUsers((prev) => [...new Set([...prev, u])]),
    onUserLeave: (u) => setUsers((prev) => prev.filter((x) => x !== u)),
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) setJoined(true);
  };

  if (!joined) {
    return (
      <main className="h-screen flex items-center justify-center bg-zinc-950">
        <pre
          className="absolute inset-0 flex items-center justify-center text-blue-900 select-none pointer-events-none"
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(10px, 1.6vw, 22px)",
            opacity: 0.25,
            whiteSpace: "pre",
            overflow: "hidden",
          }}
        >
          {GLOBE_FRAMES[frameIndex]}
        </pre>

        {/* Radial fade so globe fades to black at edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, black 80%)",
          }}
        />
        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="px-3 py-2 rounded bg-zinc-800 text-white"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded bg-blue-600 text-white"
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-zinc-950">
      <UserList users={users} />
      <Editor
        value={code}
        onChange={(val) => {
          if (isIncomingUpdate.current) {
            return;
          }
          setCode(val);
          if (sendEdit) sendEdit(val);
        }}
      />
    </main>
  );
}
