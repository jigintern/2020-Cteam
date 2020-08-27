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

//リダイレクトされたかのフラグ
let redirectFrag = false;

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

        //人数制限(とりあえず今は10人)
        const roomUserMax = 10;
        if(users.length >= roomUserMax) {
          redirectFrag = true;  //リダイレクトされたフラグを立てる
          const redirect_event = {
            event: "roomFull",
            data: getDisplayUsers(event.groupName)
          };
          try {
            userObj.ws.send(JSON.stringify(redirect_event));
          }
          catch(e) {
            console.log("人数制限時のエラー");
          }
        }
        else {
          users.push(userObj);
          groupsMap.set(event.groupName, users);
          emitUserList(event.groupName);
          emitPreviousMessages(event.groupName, ws);
          emitLoginMessage(userId);
        }
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

//退室メッセージの表示
function emitLogoutMsssage(userId) {
  const userObj = usersMap.get(userId);
  const message = {
    userId: "System",
    name: "System",
    message: `${userObj.name} logout this room`
  };
  const messages = messagesMap.get(userObj.groupName) || [];
  messages.push(message);
  messagesMap.set(messages);

  //退室者以外にメッセージを送信
  let users = groupsMap.get(userObj.groupName) || [];
  users = users.filter((u) => u.userId !== userId);
  for(const user of users) {
    //いたら削除
    if(user.ws._isClosed === true) {
      console.log("emitLogoutMessage : " + user.name);
      deleteUser(user.userId);
    }
  }
  users = groupsMap.get(userObj.groupName) || [];
  for (const user of users) {
    const tmpMessage = {
      ...message,
      sender: "System"
    };
    const event = {
      event: "message",
      data: tmpMessage,
    };
    try {
      user.ws.send(JSON.stringify(event));
    }
    catch(e) {
      console.log("emitLogoutMessage時のエラー");
      console.log(user.name + "に退室メッセージが送れませんでした");
    }
  }
}

// グループ全員に名前を表示する関数
function emitUserList(groupName) {
  // ユーザー取得
  let users = groupsMap.get(groupName) || [];
  //websocketが切断されているユーザーがいないかの確認
  for(const user of users) {
    //いたら削除
    if(user.ws._isClosed === true) {
      console.log("emitUserList : " + user.name);
      deleteUser(user.userId);
    }
  }
  users = groupsMap.get(groupName) || [];
  // グループユーザーリスト送信
  for (const user of users) {
    const event = {
      event: "users",
      data: getDisplayUsers(groupName),
    };
    try {
      user.ws.send(JSON.stringify(event));
    }
    catch(e) {
      console.log("emitUserList時のエラー");
      console.log(user.name + "にメッセージを送れませんでした");
    }
  }
}

// ユーザー表示
function getDisplayUsers(groupName) {
  let users = groupsMap.get(groupName) || [];
  for(const user of users) {
    if(user.ws._isClosed === true) {
      deleteUser(user.userId);
    }
  }
  users = groupsMap.get(groupName) || [];
  return users.map((u) => {
    return { userId: u.userId, name: u.name };
  });
}

// メッセージ送信
function emitMessage(groupName, message, senderId) {
  let users = groupsMap.get(groupName) || [];
  for(const user of users) {
    if(user.ws._isClosed === true) {
      console.log("emitMessage : " + user.name);
      deleteUser(user.userId);
    }
  }
  users = groupsMap.get(groupName) || [];
  for (const user of users) {
    const tmpMessage = {
      ...message,
      sender: user.userId === senderId ? "me" : senderId,
    };
    const event = {
      event: "message",
      data: tmpMessage,
    };
    try {
      user.ws.send(JSON.stringify(event));
    }
    catch(e) {
      console.log("emitMessage時のエラー");
      console.log(user.name + "にメッセージを送れませんでした");
      deleteUser(user.userId);
    }
  }
}

// 過去メッセージ取得
function emitPreviousMessages(groupName, ws) {
  const messages = messagesMap.get(groupName) || [];

  const event = {
    event: "previousMessages",
    data: messages,
  };
  try {
    ws.send(JSON.stringify(event));
  }
  catch(e) {
    console.log("emitPreviousMessages時のエラー");
  }
}

// グループ退出
function leaveGroup(userId) {
  const userObj = usersMap.get(userId);
  if (!userObj) {
    return;
  }
  let users = groupsMap.get(userObj.groupName) || [];
  users = users.filter((u) => u.userId !== userId);
  //リダイレクトじゃなかったら
  if(!redirectFrag) {
    //退出ユーザー表示
    emitLogoutMsssage(userId);
  }
  redirectFrag = false;  //リダイレクトフラグを下ろす
  groupsMap.set(userObj.groupName, users);
  usersMap.delete(userId);
  //誰もいなければメッセージ削除
  if(usersMap.size === 0) {
    messagesMap.set(userObj.groupName, []);
  }
  emitUserList(userObj.groupName);
}

//ユーザーリストからの削除
function deleteUser(userId) {
  const userObj = usersMap.get(userId);
  if(!userObj) {
    return;
  }
  let users = groupsMap.get(userObj.groupName) || [];
  users = users.filter((u) => u.userId !== userId);
  groupsMap.set(userObj.groupName, users);
  usersMap.delete(userId);
}