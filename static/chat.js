// ↓vscodeの関係ないエラーを無くす
// @ts-nocheck
import { isWebSocketCloseEvent } from "https://deno.land/std/ws/mod.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";

//userId,name,groupName,wsをもつMap
const usersMap = new Map();

//userMapをもつMap
const groupsMap = new Map();

//userId,name,messageをもつMap
const messagesMap = new Map();

// 接続時に呼ばれる
export default async function chat(ws) {
  const userId = v4.generate();

  for await (let data of ws) {
    const event = typeof data === "string" ? JSON.parse(data) : data;

    let userObj;

    //退出
    if (isWebSocketCloseEvent(data)) {

      leaveGroup(userId, event.groupName);

      break;
    }

    switch (event.event) {
      //参加者が来たとき
      case "join":
        userObj = {
          userId,
          name: event.name,
          groupName: event.groupName,
          ws,
        };

        usersMap.set(userId, userObj);

        const users = groupsMap.get(event.groupName) || [];
        users.push(userObj);
        groupsMap.set(event.groupName, users);

        emitUserList(event.groupName);

        emitPreviousMessages(event.groupName, ws);

        //入室メッセージを表示したい----
        emitLoginMessage(userId);
        //-----------------------------

        break;

      // メッセージを受け取ったとき

      case "message":
        userObj = usersMap.get(userId);
        const message = {
          userId,
          name: userObj.name,
          message: event.data,
        };
        const messages = messagesMap.get(userObj.groupName) || [];
        messages.push(message);
        messagesMap.set(userObj.groupName, messages);
        emitMessage(userObj.groupName, message, userId);
        break;
    }
  }
}

//ログイン時のメッセージ
function emitLoginMessage(userId) {
  const userObj = usersMap.get(userId);
  const message = {
    userId: "System",
    name: "System",
    message: `${userObj.name} login this room`
  };
  const messages = messagesMap.get(userObj.groupName) || [];
  messages.push(message);
  messagesMap.set(userObj.groupName, messages);
  emitMessage(userObj.groupName, message, "System");
}

function emitLogoutMsssage(userId) {
}

// グループ全員に名前を表示する関数
function emitUserList(groupName) {
  // ユーザー取得
  const users = groupsMap.get(groupName) || [];
  // グループユーザーリスト送信
  for (const user of users) {
    const event = {
      event: "users",
      data: getDisplayUsers(groupName),
    };
    user.ws.send(JSON.stringify(event));
  }
}

// ユーザー表示
function getDisplayUsers(groupName) {
  const users = groupsMap.get(groupName) || [];
  return users.map((u) => {
    return { userId: u.userId, name: u.name };
  });
}

// メッセージ送信
function emitMessage(groupName, message, senderId) {
  const users = groupsMap.get(groupName) || [];
  for (const user of users) {
    const tmpMessage = {
      ...message,
      sender: user.userId === senderId ? "me" : senderId,
    };
    const event = {
      event: "message",
      data: tmpMessage,
    };
    user.ws.send(JSON.stringify(event));
  }
}

// 過去メッセージ取得
function emitPreviousMessages(groupName, ws) {
  const messages = messagesMap.get(groupName) || [];

  const event = {
    event: "previousMessages",
    data: messages,
  };
  ws.send(JSON.stringify(event));
}

// グループ退出
function leaveGroup(userId) {
  const userObj = usersMap.get(userId);
  if (!userObj) {
    return;
  }
  let users = groupsMap.get(userObj.groupName) || [];

  users = users.filter((u) => u.userId !== userId);

  //退出ユーザー表示-----
  emitLogoutMsssage(userId);
  //-------------------

  groupsMap.set(userObj.groupName, users);

  usersMap.delete(userId);

  //誰もいなければメッセージ削除
  if(usersMap.size === 0) {
    messagesMap.set(userObj.groupName, []);
  }

  emitUserList(userObj.groupName);
}

export function user_count(groupName) {
  console.log("count member this room");
}
