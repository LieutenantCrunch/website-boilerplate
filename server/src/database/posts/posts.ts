import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import * as ClientConstants from '../../constants/constants.client';
import * as ServerConstants from '../../constants/constants.server';
import { isNullOrWhiteSpaceOnly } from '../../utilities/utilityFunctions';
import { SocketHelper } from '../../utilities/socketHelper';

import { models } from '../../models/_index';
import { DisplayNameInstance } from '../../models/DisplayName';
import { FeedViewInstance } from '../../models/views/FeedView';
import { PostInstance } from '../../models/Post';
import { PostFileInstance } from '../../models/PostFile';
import { ProfilePictureInstance } from '../../models/ProfilePicture';
import { UserConnectionTypeInstance } from '../../models/UserConnectionType';
import { UserInstance } from '../../models/User';
import { UserPreferencesInstance } from '../../models/UserPreferences';

import { getCommentsForPost } from './sub/comments';

import { checkIfFirstUserIsBlockingSecond } from '../users/sub/blocking';
import { getUniqueIdForUserId, getUserIdForUniqueId } from '../users/sub/fields';
import { checkUserForRole } from '../users/sub/roles';
import { getUserWithUniqueId, getUserWithProfileName } from '../users/sub/searches';

import * as _comments from './sub/comments';
import * as _files from './sub/files';
import * as _notifications from './sub/notifications';

export const Comments = _comments;
export const Files = _files;
export const Notifications = _notifications;

// The end date is used to prevent new posts from coming back and winding up inserted in a strange place in the list. If they want the latest posts, they'll have to refresh the page
export const getPostsByUser = async function(requestingUserUniqueId: string | undefined, postedByUniqueId: string | undefined, profileName: string | undefined, postType: number | null, endDate: Date | undefined, pageNumber: number | undefined): Promise<{posts: WebsiteBoilerplate.Post[], total: number}> {
    let posts: WebsiteBoilerplate.Post[] = [];
    let total: number = 0;

    try {
        let registeredUser: UserInstance | null = null;
        
        if (!isNullOrWhiteSpaceOnly(postedByUniqueId)) {
            registeredUser = await getUserWithUniqueId(postedByUniqueId!);
        }
        else if (!isNullOrWhiteSpaceOnly(profileName)) {
            registeredUser = await getUserWithProfileName(profileName!);
        }

        if (registeredUser) {
            let registeredUserId: number = registeredUser.id!;

            // Set it just in case it's not set already
            postedByUniqueId = registeredUser.uniqueId;

            // Make sure the user can view the posts
            let canView: Boolean = false;
            let canDelete: Boolean = false;
            let isPublicUser: Boolean = isNullOrWhiteSpaceOnly(requestingUserUniqueId);

            if (requestingUserUniqueId === postedByUniqueId) {
                // You can always view your own posts
                canView = true;
                // You can delete your own posts
                canDelete = true;
            }
            else if (await checkUserForRole(registeredUser.id!, 'Administrator')) {
                // Administrators can view all posts
                canView = true;
                // Administrators can delete all posts
                canDelete = true;
            }
            else if (isPublicUser && registeredUser.allowPublicAccess) {
                // Public users can view posts of registered users that allow it
                canView = true;
            }
            else if (!isPublicUser && !(await checkIfFirstUserIsBlockingSecond(registeredUserId, requestingUserUniqueId!))) {
                // If the requesting user is an actual user and they're not blocked
                canView = true;
            }

            if (canView) {
                // This has to be done separate due to the fact that the files are being joined in, 
                // thus causing single posts to be counted multiple times when there are multiple 
                // images for a particular post
                let count: number = await models.Views.FeedView.count({
                    where: {
                        userUniqueId: isPublicUser ? { [Op.is]: null } : requestingUserUniqueId,
                        postedByUniqueId,
                        postedOn: {
                            [Op.lte]: endDate || new Date(Date.now())
                        }
                    }
                });

                let rows: FeedViewInstance[] = await models.Views.FeedView.findAll({
                    where: {
                        userUniqueId: isPublicUser ? { [Op.is]: null } : requestingUserUniqueId,
                        postedByUniqueId,
                        postedOn: {
                            [Op.lte]: endDate || new Date(Date.now())
                        }
                    },
                    order: [
                        ['id', 'DESC']
                    ],
                    include: [
                        {
                            model: models.PostFile,
                            as: 'postFiles'
                        }
                    ],
                    offset: (pageNumber || 0) * ServerConstants.DB_FEED_FETCH_PAGE_SIZE,
                    limit: ServerConstants.DB_FEED_FETCH_PAGE_SIZE,
                    subQuery: false // See subquery note
                });

                posts = rows.map(row => {
                    let dbPostFiles: PostFileInstance[] | undefined = row.postFiles;
                    let postFiles: WebsiteBoilerplate.PostFileInfo[] | undefined = undefined;
    
                    if (dbPostFiles && dbPostFiles.length > 0) {
                        let filePath: string = `${ClientConstants.PUBLIC_USER_PATH}${postedByUniqueId}/`;
    
                        switch (row.postType) {
                            case ClientConstants.POST_TYPES.AUDIO:
                                filePath += 'a/';
                                break;
                            case ClientConstants.POST_TYPES.IMAGE:
                                filePath += 'i/';
                                break;
                            case ClientConstants.POST_TYPES.VIDEO:
                                filePath += 'v/';
                                break;
                            default:
                                break;
                        }
    
                        postFiles = dbPostFiles.map(dbPostFile => ({
                            fileName: `${filePath}${dbPostFile.fileName}`,
                            mimeType: dbPostFile.mimeType,
                            originalFileName: dbPostFile.originalFileName,
                            size: dbPostFile.fileSize,
                            thumbnailFileName: dbPostFile.thumbnailFileName ? `${filePath}${dbPostFile.thumbnailFileName}` : undefined
                        }));
                    }
    
                    return {
                        canDelete,
                        lastEditedOn: row.lastEditedOn,
                        commentCount: row.commentCount,
                        postedOn: row.postedOn,
                        postText: row.postText,
                        postTitle: row.postTitle,
                        postType: row.postType,
                        postedBy: {
                            displayName: row.postedByDisplayName,
                            displayNameIndex: row.postedByDisplayNameIndex,
                            pfpSmall: row.postedByPfpSmall ? `${ClientConstants.PUBLIC_USER_PATH}${postedByUniqueId!}/${row.postedByPfpSmall}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`,
                            profileName: row.postedByProfileName,
                            uniqueId: postedByUniqueId!
                        },
                        uniqueId: row.uniqueId,
                        postFiles
                    };
                });
    
                total = ((count as unknown) as Array<{count: number}>).length ? ((count as unknown) as Array<{count: number}>).length : count;
            }
        }
    }
    catch (err) {
        console.error(`Error getting posts for user ${postedByUniqueId}:\n${err.message}`);
    }

    return {posts, total};
}

// The end date is used to prevent new posts from coming back and winding up inserted in a strange place in the list. If they want the latest posts, they'll have to refresh the page
export const getFeed = async function(uniqueId: string | number | undefined, postType: number | undefined, endDate: Date | undefined, pageNumber: number | undefined): Promise<{posts: WebsiteBoilerplate.Post[], total: number, returnPostType: number}> {
    let registeredUserId: number | undefined = undefined;
    let posts: WebsiteBoilerplate.Post[] = [];
    let total: number = 0;
    let returnPostType: number = ClientConstants.POST_TYPES.ALL;

    if (typeof uniqueId === 'number') {
        registeredUserId = uniqueId;
        uniqueId = await getUniqueIdForUserId(registeredUserId);
    }
    else if (typeof uniqueId === 'string') {
        registeredUserId = await getUserIdForUniqueId(uniqueId);
    }

    if (uniqueId !== undefined) {
        let feedFilter: number | undefined = undefined;
        let showMyPostsInFeed: Boolean = false;

        if (registeredUserId !== undefined) { // It shouldn't be undefined, but we have to check it to keep TypeScript happy
            let userPreferences: UserPreferencesInstance | null = await models.UserPreferences.findOne({
                attributes: [
                    'feedFilter',
                    'showMyPostsInFeed'
                ],
                where: {
                    registeredUserId
                }
            });

            if (userPreferences) {
                feedFilter = userPreferences.feedFilter!;
                showMyPostsInFeed = Boolean(userPreferences.showMyPostsInFeed);
            }
        }

        // This has to be done separate due to the fact that the files are being joined in, 
        // thus causing single posts to be counted multiple times when there are multiple 
        // images for a particular post
        let whereOptions: {[key: string]: any;} = {
            userUniqueId: uniqueId,
            postedOn: {
                [Op.lte]: endDate || new Date(Date.now())
            }
        };

        if (!showMyPostsInFeed) {
            whereOptions.postedByUniqueId = { [Op.ne]: uniqueId };
        }

        // If they're requesting a specific type of posts
        if (postType !== undefined) {
            // postType -1 indicates that the default preference should be used
            // If the feedFilter defined and isn't ALL
            if (postType === -1) {
                if (feedFilter !== undefined && feedFilter !== ClientConstants.POST_TYPES.ALL) {
                    // Set the postType filter to the user preference value
                    whereOptions.postType = feedFilter;
                    returnPostType = feedFilter;
                }
            }
            // Else, if the postType isn't ALL
            else if (postType !== ClientConstants.POST_TYPES.ALL) {
                // Set the postType filter to the requested postType value
                whereOptions.postType = postType;
                returnPostType = postType;
            }
        }
        
        const count: number = await models.Views.FeedView.count({
            where: whereOptions
        });

        const rows: FeedViewInstance[] = await models.Views.FeedView.findAll({
            where: whereOptions,
            order: [
                ['id', 'DESC']
            ],
            include: [
                {
                    model: models.PostFile,
                    as: 'postFiles'
                }
            ],
            offset: (pageNumber || 0) * ServerConstants.DB_FEED_FETCH_PAGE_SIZE,
            limit: ServerConstants.DB_FEED_FETCH_PAGE_SIZE
        });

        posts = rows.map(row => {
            let dbPostFiles: PostFileInstance[] | undefined = row.postFiles;
            let postFiles: WebsiteBoilerplate.PostFileInfo[] | undefined = undefined;

            if (dbPostFiles && dbPostFiles.length > 0) {
                let filePath: string = `${ClientConstants.PUBLIC_USER_PATH}${row.postedByUniqueId}/`;

                switch (row.postType) {
                    case ClientConstants.POST_TYPES.AUDIO:
                        filePath += 'a/';
                        break;
                    case ClientConstants.POST_TYPES.IMAGE:
                        filePath += 'i/';
                        break;
                    case ClientConstants.POST_TYPES.VIDEO:
                        filePath += 'v/';
                        break;
                    default:
                        break;
                }

                postFiles = dbPostFiles.map(dbPostFile => ({
                    fileName: `${filePath}${dbPostFile.fileName}`,
                    mimeType: dbPostFile.mimeType,
                    originalFileName: dbPostFile.originalFileName,
                    size: dbPostFile.fileSize,
                    thumbnailFileName: dbPostFile.thumbnailFileName ? `${filePath}${dbPostFile.thumbnailFileName}` : undefined
                }));
            }

            return {
                canDelete: row.postedByUniqueId === uniqueId,
                lastEditedOn: row.lastEditedOn,
                commentCount: row.commentCount,
                postedOn: row.postedOn,
                postText: row.postText,
                postTitle: row.postTitle,
                postType: row.postType,
                postedBy: {
                    displayName: row.postedByDisplayName,
                    displayNameIndex: row.postedByDisplayNameIndex,
                    pfpSmall: row.postedByPfpSmall ? `${ClientConstants.PUBLIC_USER_PATH}${row.postedByUniqueId}/${row.postedByPfpSmall}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`,
                    profileName: row.postedByProfileName,
                    uniqueId: row.postedByUniqueId
                },
                uniqueId: row.uniqueId,
                postFiles
            };
        });

        total = count;
    }

    return {posts, total, returnPostType};
}

export const addNewPost = async function(uniqueId: string, postType: number, postTitle: string | undefined, postText: string | undefined, audience: number, customAudience: string | undefined, postFiles: WebsiteBoilerplate.PostFileInfo[] | undefined): Promise<{newPost: WebsiteBoilerplate.Post | undefined, postId: number | undefined}> {
    try
    {
        let registeredUser: UserInstance | null = await getUserWithUniqueId(uniqueId);

        if (registeredUser) {
            let failedValidation: Boolean = false;

            // First, run server-side validation as a last minute check to try to prevent bad posts
            if (postTitle && postTitle.length > 50) {
                failedValidation = true;
            }
            else if (postText && postText.length > 2000) {
                failedValidation = true;
            }

            // If there are files, verify only the allowed amounts are present and that the mimetypes are correct
            let fileCount: number = 0;
            let filePath: string = `${ClientConstants.PUBLIC_USER_PATH}${registeredUser.uniqueId}/`;

            switch (postType) {
                case ClientConstants.POST_TYPES.AUDIO:
                    if (isNullOrWhiteSpaceOnly(postTitle)) {
                        failedValidation = true;
                    }

                    filePath += 'a/';
                    break;
                case ClientConstants.POST_TYPES.IMAGE:
                    filePath += 'i/';
                    break;
                case ClientConstants.POST_TYPES.VIDEO:
                    if (isNullOrWhiteSpaceOnly(postTitle)) {
                        failedValidation = true;
                    }

                    filePath += 'v/';
                    break;
                default:
                    if (isNullOrWhiteSpaceOnly(postText)) {
                        failedValidation = true;
                    }

                    break;
            }

            if (postFiles) {
                fileCount = postFiles.length;

                // Last minute check to prevent uploading more files than allowed
                if (fileCount > 0) {
                    switch (postType) {
                        case ClientConstants.POST_TYPES.AUDIO: {
                            let audioFile: WebsiteBoilerplate.PostFileInfo = postFiles[0];
                            let foundError: Boolean = false;

                            if (fileCount > 1) {
                                postFiles.splice(1);
                            }

                            if (!audioFile.mimeType.startsWith('audio/')) {
                                foundError = true;
                            }
                            else if (audioFile.originalFileName.length > 150) {
                                foundError = true;
                            }

                            if (foundError) {
                                postFiles = [];
                            }

                            break;
                        }
                        case ClientConstants.POST_TYPES.IMAGE: {
                            let foundError: Boolean = false;

                            if (fileCount > 4) {
                                postFiles.splice(4);
                            }

                            if (postFiles.some(postFile => (!postFile.mimeType.startsWith('image/') || postFile.originalFileName.length > 150))) {
                                foundError = true;
                            }

                            if (foundError) {
                                postFiles = [];
                            }

                            break;
                        }
                        case ClientConstants.POST_TYPES.VIDEO: {
                            let videoFile: WebsiteBoilerplate.PostFileInfo = postFiles[0];
                            let foundError: Boolean = false;

                            if (fileCount > 1) {
                                postFiles.splice(1);
                            }

                            if (!videoFile.mimeType.startsWith('video/')) {
                                foundError = true;
                            }
                            else if (videoFile.originalFileName.length > 150) {
                                foundError = true;
                            }

                            if (foundError) {
                                postFiles = [];
                            }

                            break;
                        }
                        case ClientConstants.POST_TYPES.TEXT:
                        default: {
                            postFiles = [];

                            break;
                        }
                    }
                }

                fileCount = postFiles.length;
            }

            if ((fileCount === 0 && !postText) || failedValidation) {
                return {newPost: undefined, postId: undefined};
            }

            let postedOn: Date = new Date(Date.now());
            let postUniqueId: string = uuidv4();

            let newPost: PostInstance | null = await models.Post.create({
                audience,
                postedOn,
                postText: postText || null,
                postTitle: postTitle || null,
                postType,
                registeredUserId: registeredUser.id!,
                uniqueId: postUniqueId
            });

            if (newPost) {
                let parsedConnectionTypes: string [] = [];

                if (customAudience) {
                    parsedConnectionTypes = customAudience.split(',');

                    let connectionTypes: UserConnectionTypeInstance[] = await models.UserConnectionType.findAll({
                        where: {
                            displayName: {
                                [Op.in]: parsedConnectionTypes
                            }
                        }
                    });

                    if (connectionTypes.length > 0) {
                        await newPost.addConnectionTypes(connectionTypes);
                    }
                }

                if (fileCount > 0) {
                    for (let postFile of postFiles!) {
                        await models.PostFile.create({
                            postId: newPost!.id,
                            registeredUserId: registeredUser.id!,
                            fileName: postFile.fileName,
                            fileSize: postFile.size,
                            mimeType: postFile.mimeType,
                            originalFileName: postFile.originalFileName,
                            thumbnailFileName: postFile.thumbnailFileName || null
                        });
                    }
                }

                let displayNames: DisplayNameInstance[] = registeredUser.displayNames!;
                let displayName: DisplayNameInstance = displayNames[0];
                let profilePictures: ProfilePictureInstance[] = registeredUser.profilePictures!;
                let profilePicture: ProfilePictureInstance | undefined = profilePictures[0];

                let returnPostFiles: WebsiteBoilerplate.PostFileInfo[] = [];

                if (fileCount > 0) {
                    returnPostFiles = postFiles!.map(file => ({
                        ...file,
                        fileName: `${filePath}${file.fileName}`,
                        thumbnailFileName: file.thumbnailFileName ? `${filePath}${file.thumbnailFileName}` : undefined
                    }));
                }

                return { 
                    newPost: {
                        canDelete: true, /* This is returning the new post back to the creator, they can delete it */
                        lastEditedOn: null,
                        commentCount: 0,
                        postedOn,
                        postText: postText || null,
                        postTitle: postTitle || null,
                        postType,
                        postedBy: {
                            displayName: displayName.displayName,
                            displayNameIndex: displayName.displayNameIndex,
                            pfpSmall: profilePicture ? `${ClientConstants.PUBLIC_USER_PATH}${registeredUser.uniqueId}/${profilePicture.smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`,
                            profileName: registeredUser.profileName,
                            uniqueId: registeredUser.uniqueId
                        },
                        uniqueId: postUniqueId,
                        postFiles: returnPostFiles
                    },
                    postId: newPost.id!
                };
            }
        }
    }
    catch(err)
    {
        console.error(`Error adding new post:\n${err.message}`);
    }

    return {newPost: undefined, postId: undefined};
}

export const getPost = async function(userUniqueId: string | undefined, postUniqueId: string, commentUniqueId: string | undefined): Promise<WebsiteBoilerplate.Post | undefined> {
    let isPublicUser: Boolean = isNullOrWhiteSpaceOnly(userUniqueId);
    let postInfo: FeedViewInstance | null = await models.Views.FeedView.findOne({
        where: {
            uniqueId: postUniqueId,
            userUniqueId: isPublicUser ? { [Op.is]: null } : userUniqueId
        },
        include: [
            {
                model: models.PostFile,
                as: 'postFiles'
            }
        ],
        subQuery: false
    });

    if (postInfo) {
        let postComments: WebsiteBoilerplate.PostComment[] = [];
        let commentPage: number = 0;

        if (!isPublicUser && commentUniqueId !== undefined) {
            let endDate: Date = new Date(Date.now());
            let commentFound: Boolean = false;
            let fetchedCount: number = 0;

            do {
                let { comments: fetchedComments }: { comments: WebsiteBoilerplate.PostComment[] } = await getCommentsForPost(userUniqueId!, postUniqueId, endDate, commentPage);
                commentPage++;
                fetchedCount = fetchedComments.length;

                if (fetchedComments.find(fetchedComment => fetchedComment.uniqueId === commentUniqueId)) {
                    commentFound = true;
                    commentPage--; // Back the commentPage up one
                }

                postComments.push(...fetchedComments);

            } while (fetchedCount && !commentFound);

            if (!commentFound) {
                postComments = [];
            }
        }

        let dbPostFiles: PostFileInstance[] | undefined = postInfo.postFiles;
        let postFiles: WebsiteBoilerplate.PostFileInfo[] | undefined = undefined;

        if (dbPostFiles && dbPostFiles.length > 0) {
            let filePath: string = `${ClientConstants.PUBLIC_USER_PATH}${postInfo.postedByUniqueId}/`;

            switch (postInfo.postType) {
                case ClientConstants.POST_TYPES.AUDIO:
                    filePath += 'a/';
                    break;
                case ClientConstants.POST_TYPES.IMAGE:
                    filePath += 'i/';
                    break;
                case ClientConstants.POST_TYPES.VIDEO:
                    filePath += 'v/';
                    break;
                default:
                    break;
            }

            postFiles = dbPostFiles.map(dbPostFile => ({
                fileName: `${filePath}${dbPostFile.fileName}`,
                mimeType: dbPostFile.mimeType,
                originalFileName: dbPostFile.originalFileName,
                size: dbPostFile.fileSize,
                thumbnailFileName: dbPostFile.thumbnailFileName ? `${filePath}${dbPostFile.thumbnailFileName}` : undefined
            }));
        }

        return {
            canDelete: userUniqueId === postInfo.postedByUniqueId,
            lastEditedOn: postInfo.lastEditedOn,
            commentCount: postInfo.commentCount,
            postedOn: postInfo.postedOn,
            postText: postInfo.postText,
            postTitle: postInfo.postTitle,
            postType: postInfo.postType,
            postedBy: {
                displayName: postInfo.postedByDisplayName,
                displayNameIndex: postInfo.postedByDisplayNameIndex,
                pfpSmall: postInfo.postedByPfpSmall ? `${ClientConstants.PUBLIC_USER_PATH}${postInfo.postedByUniqueId}/${postInfo.postedByPfpSmall}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`,
                profileName: postInfo.postedByProfileName,
                uniqueId: postInfo.postedByUniqueId
            },
            uniqueId: postInfo.uniqueId,
            postFiles,
            commentPage,
            postComments
        };
    }

    return undefined;
}

export const deletePost = async function(userUniqueId: string, uniqueId: string): Promise<Boolean> {
    try {
        let registeredUserId: number | undefined = await getUserIdForUniqueId(userUniqueId);

        if (registeredUserId) {
            let isAdministrator: Boolean = await checkUserForRole(registeredUserId, 'Administrator');

            let whereOptions: { [key: string]: any } = { uniqueId };

            // Administrators can delete any post, regardless of whether they created it or not
            if (!isAdministrator) {
                whereOptions.registeredUserId = registeredUserId;
            }

            let post: PostInstance | null = await models.Post.findOne({
                where: whereOptions,
                include: [
                    {
                        model: models.PostComment,
                        as: 'postComments',
                        attributes: [
                            'id',
                            'registeredUserId'
                        ],
                        include: [
                            {
                                model: models.User,
                                as: 'registeredUser',
                                attributes: [
                                    'uniqueId'
                                ]
                            }
                        ]
                    }
                ]
            });

            if (post) {
                await post.destroy();

                let notificationIds: string[] = [userUniqueId];

                if (post.postComments && post.postComments.length > 0) {
                    for (let postComment of post.postComments) {
                        let commenter: UserInstance = postComment.registeredUser!;
                        let commenterUniqueId: string = commenter.uniqueId;

                        if (!notificationIds.find(notificationId => notificationId === commenterUniqueId)) {
                            notificationIds.push(commenterUniqueId);
                        }
                    }
                }

                SocketHelper.notifyUsers(notificationIds, ClientConstants.SOCKET_EVENTS.NOTIFY_USER.DELETED_POST);

                return true;
            }
        }
    }
    catch (err) {
        console.error(`Error deleting post (${uniqueId}) for user ${userUniqueId}:\n${err.message}`);
    }

    return false;
}
