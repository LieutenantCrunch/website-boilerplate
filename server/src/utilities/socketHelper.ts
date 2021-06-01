import * as SocketIO from 'socket.io';
import { socketCache } from './socketCache';

export class SocketHelper {
    static notifyUser(uniqueId: string, messageType: string, notification?: WebsiteBoilerplate.PostNotification) {
        let socketMap: Map<string, SocketIO.Socket> | undefined = socketCache.getSocketsForUser(uniqueId);

        if (socketMap && socketMap.size > 0) {
            for (let socket of socketMap.values()) {
                if (notification) {
                    socket.emit(messageType, notification);
                }
                else {
                    socket.emit(messageType);
                }
            }
        }
    }

    static notifyUsers(uniqueIds: string[], messageType: string, notification? : WebsiteBoilerplate.PostNotification) {
        for (let uniqueId of uniqueIds) {
            this.notifyUser(uniqueId, messageType, notification);
        }
    }
}
