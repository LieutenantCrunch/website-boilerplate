import * as SocketIO from 'socket.io';
import { socketCache } from './socketCache';

export class SocketHelper {
    static notifyUser(uniqueId: string, messageType: string, notification: WebsiteBoilerplate.PostNotification) {
        let socketMap: Map<string, SocketIO.Socket> | undefined = socketCache.getSocketsForUser(uniqueId);

        if (socketMap && socketMap.size > 0) {
            for (let socket of socketMap.values()) {
                socket.emit(messageType, notification);
            }
        }
    }
}
