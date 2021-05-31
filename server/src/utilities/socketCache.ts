import * as SocketIO from 'socket.io';

const MAX_SOCKET_MAP_SIZE: number = 1000000;

// Based off https://gist.github.com/josephrocca/44e4c0b63828cfc6d6155097b2efc113
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
export class SocketCache {
    private userMaps: Map<string, Map<string, SocketIO.Socket>>[];
    private _size: number = 0;

    constructor () {
        this.userMaps = [new Map<string, Map<string, SocketIO.Socket>>()];
    }

    get size () {
        return this._size;
    }

    clear() {
        for (let userMap of this.userMaps) {
            let socketMaps: IterableIterator<Map<string, SocketIO.Socket>> = userMap.values();

            for (let socketMap of socketMaps) {
                socketMap.clear();
            }
        }

        this._size = 0;
    }

    deleteUser(userId: string): Boolean {
        for (let userMap of this.userMaps) {
            if (userMap.has(userId)) {
                let totalSockets: number = userMap.size;

                userMap.clear();
                this._size -= totalSockets;

                return true;
            }
        }

        return false;
    }

    deleteSocket(socketId: string): Boolean {
        for (let userMap of this.userMaps) {
            let socketMaps: IterableIterator<Map<string, SocketIO.Socket>> = userMap.values();

            for (let socketMap of socketMaps) {
                if (socketMap.delete(socketId)) {
                    this._size--;
                    return true;
                }
            }
        }

        return false;
    }

    getSocketsForUser (userId: string): Map<string, SocketIO.Socket> | undefined {
        for (let userMap of this.userMaps) {
            let socketMap: Map<string, SocketIO.Socket> | undefined = userMap.get(userId);

            if (socketMap) {
                return socketMap;
            }
        }

        return undefined;
    }

    hasUser (userId: string) {
        for (let userMap of this.userMaps) {
            if (userMap.has(userId)) {
                return true;
            }

            return false;
        }
    }

    hasSocket (socketId: string) {
        for (let userMap of this.userMaps) {
            let socketMaps: IterableIterator<Map<string, SocketIO.Socket>> = userMap.values();

            for (let socketMap of socketMaps) {
                if (socketMap.has(socketId)) {
                    return true;
                }
            }
        }

        return false;
    }

    // This needs to handle a single key having multiple sockets
    setSocket (userId: string, socketId: string, socket: SocketIO.Socket) {
        let socketMap: Map<string, SocketIO.Socket> | undefined = this.getSocketsForUser(userId);

        if (socketMap) {
            if (socketMap.has(socketId)) {
                socketMap.set(socketId, socket);
                return this;
            }
            else {
                socketMap.set(socketId, socket);
                this._size++;
                return this;
            }
        }
        else {
            for (let userMap of this.userMaps) {
                if (userMap.size < MAX_SOCKET_MAP_SIZE) {
                    let socketMap: Map<string, SocketIO.Socket> = new Map<string, SocketIO.Socket>();

                    socketMap.set(socketId, socket);
                    userMap.set(userId, socketMap);

                    this._size++;
                    return this;
                }
            }
        }

        // If we made it here, there are no userMaps left that aren't max size, need to create a new one
        let userMap: Map<string, Map<string, SocketIO.Socket>> = new Map<string, Map<string, SocketIO.Socket>>();

        socketMap = new Map<string, SocketIO.Socket>();
        socketMap.set(socketId, socket);
        userMap.set(userId, socketMap);

        this._size++;

        this.userMaps.push(userMap);

        return this;
    }

    /* // Not Implemented
    keys () {

    }

    values () {

    }

    entries () {

    }

    foreach(callbackFn: Function, thisArg?: Map<string, Map<string, SocketIO.Socket>>) {

    }

    [Symbol.iterator]() {

    }*/
};

export const socketCache: SocketCache = new SocketCache();
