import { useEffect, useState } from "react";
import type * as monaco from "monaco-editor";
import type { EditorType, Message } from "@mock-me/messages";
import { useSocket } from "./useSocket.js";

export interface useRemoteEditorProps {
  editorType: EditorType;
}

export const useRemoteEditor = ({ editorType }: useRemoteEditorProps) => {
  const { sendMessage, socket, connected } = useSocket();
  const [value, setValue] = useState<string>();

  const onOpen = () => {
    sendMessage({
      type: "GET_EDITOR_VALUE",
      data: { editorType },
    });
  };

  const onMessage = (messageEvent: MessageEvent<any>) => {
    try {
      const maybeValidMessage = JSON.parse(messageEvent.data);

      if (!("type" in maybeValidMessage)) {
        return;
      }

      const slightlyMoreValidMessage = maybeValidMessage as Message;
      if (slightlyMoreValidMessage.type !== "EDITOR_VALUE") {
        return;
      } else if (slightlyMoreValidMessage.data.editorType !== editorType) {
        return;
      }

      setValue(slightlyMoreValidMessage.data.value);
    } catch (e) {
      // TODO: Handle error
      console.error(e);
    }
  };

  const sendChanges = (
    changes: monaco.editor.IModelContentChangedEvent["changes"]
  ) => {
    sendMessage({ type: "CHANGE_EDITOR_VALUE", data: { editorType, changes } });
  };

  useEffect(() => {
    socket.addEventListener("open", onOpen);
    socket.addEventListener("message", onMessage);

    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("message", onMessage);
    };
  }, []);

  return { value, connected, sendChanges };
};
