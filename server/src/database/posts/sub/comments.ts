import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import * as ClientConstants from '../../../constants/constants.client';
import * as ServerConstants from '../../../constants/constants.server';
import { SocketHelper } from '../../../utilities/socketHelper';

import { models } from '../../../models/_index';
import { DisplayNameInstance } from '../../../models/DisplayName';
import { FeedViewInstance } from '../../../models/views/FeedView';
import { PostCommentInstance } from '../../../models/PostComment';
import { PostInstance } from '../../../models/Post';
import { ProfilePictureInstance } from '../../../models/ProfilePicture';
import { UserInstance } from '../../../models/User';

import { getUserIdForUniqueId } from '../../users/sub/fields';
import { checkUserForRole } from '../../users/sub/roles';
import { getUserWithId, getUserWithUniqueId } from '../../users/sub/searches';

export const addNewPostComment = async function(userUniqueId: string, postUniqueId: string, commentText: string, parentCommentUniqueId: string | undefined): Promise<WebsiteBoilerplate.PostComment | undefined> {
    try {
        // Validate that this user can actually comment on the post
        let postInfo: FeedViewInstance | null = await models.Views.FeedView.findOne({
            attributes: [
                'id',
                'postedByUniqueId',
                'uniqueId'
            ],
            where: {
                userUniqueId,
                uniqueId: postUniqueId
            }
        });

        let commenter: UserInstance | null = await getUserWithUniqueId(userUniqueId);
        
        if (postInfo && commenter) {
            let postAuthor: UserInstance | null = await getUserWithUniqueId(postInfo.postedByUniqueId);

            if (postAuthor) {
                let postedOn: Date = new Date(Date.now());
                let parentCommentId: number | undefined = undefined;
                let parentComment: PostCommentInstance | null = null;

                if (parentCommentUniqueId) {
                    parentComment = await models.PostComment.findOne({
                        attributes: [
                            'id',
                            'commentText',
                            'registeredUserId',
                            'uniqueId'
                        ],
                        where: {
                            uniqueId: parentCommentUniqueId
                        }
                    });

                    if (parentComment) {
                        parentCommentId = parentComment.id!;
                    }
                }

                let uniqueId: string = uuidv4();

                let newPostComment: PostCommentInstance | null = await models.PostComment.create({
                    postedOn,
                    postId: postInfo.id!,
                    registeredUserId: commenter.id!,
                    commentText,
                    uniqueId,
                    parentCommentId
                });

                if (newPostComment) {
                    let commenterDisplayNames: DisplayNameInstance[] = commenter.displayNames!;
                    let commenterDisplayName: DisplayNameInstance = commenterDisplayNames[0];
                    let commenterProfilePictures: ProfilePictureInstance[] = commenter.profilePictures!;
                    let commenterProfilePicture: ProfilePictureInstance | undefined = commenterProfilePictures[0];

                    let returnComment: WebsiteBoilerplate.PostComment = {
                        canDelete: true, /* This is returning the new comment back to the creator, they can delete it */
                        commentText,
                        postedBy: {
                            displayName: commenterDisplayName.displayName,
                            displayNameIndex: commenterDisplayName.displayNameIndex,
                            pfpSmall: commenterProfilePicture ? `${ClientConstants.PUBLIC_USER_PATH}${commenter.uniqueId}/${commenterProfilePicture.smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`,
                            profileName: commenter.profileName,
                            uniqueId: commenter.uniqueId
                        },
                        uniqueId
                    };

                    if (parentComment !== null) {
                        let parentCommenter: UserInstance | null = await getUserWithId(parentComment.registeredUserId);

                        if (parentCommenter) {
                            let parentCommenterDisplayNames: DisplayNameInstance[] = parentCommenter.displayNames!;
                            let parentCommenterDisplayName: DisplayNameInstance = parentCommenterDisplayNames[0];

                            returnComment.parentComment = {
                                commentText: parentComment.commentText,
                                postedBy: {
                                    displayName: parentCommenterDisplayName.displayName,
                                    displayNameIndex: parentCommenterDisplayName.displayNameIndex
                                },
                                uniqueId: parentComment.uniqueId
                            };

                            models.PostNotification.create({
                                commentId: newPostComment.id!,
                                createdOn: postedOn,
                                notificationStatus: ClientConstants.NOTIFICATION_STATUS.UNSEEN, /* This is defaulted in the model, but set it here to be safe */
                                notificationType: ClientConstants.NOTIFICATION_TYPES.COMMENT_REPLY,
                                postId: postInfo.id,
                                registeredUserId: parentCommenter.id!,
                                triggeredByUserId: commenter.id!
                            });

                            SocketHelper.notifyUser(parentCommenter.uniqueId, ClientConstants.SOCKET_EVENTS.NOTIFY_USER.NEW_COMMENT);
                        };
                    }

                    let { postedByUniqueId }: { postedByUniqueId: string } = postInfo;

                    // Shouldn't have to wait for the Post Notification to be created
                    // let postNotification: PostNotificationInstance = await models.PostNotification.create({
                    models.PostNotification.create({
                        commentId: newPostComment.id!,
                        createdOn: postedOn,
                        notificationStatus: ClientConstants.NOTIFICATION_STATUS.UNSEEN, /* This is defaulted in the model, but set it here to be safe */
                        notificationType: 0,
                        postId: postInfo.id,
                        registeredUserId: postAuthor.id!,
                        triggeredByUserId: commenter.id!
                    });

                    SocketHelper.notifyUser(postedByUniqueId, ClientConstants.SOCKET_EVENTS.NOTIFY_USER.NEW_COMMENT);

                    return returnComment;
                }
            }
        }
    }
    catch (err) {
        console.error(`Error adding new comment:\n${err.message}`);
    }

    return undefined;
}

export const deletePostComment = async function(userUniqueId: string, uniqueId: string): Promise<Boolean> {
    try {
        let registeredUserId: number | undefined = await getUserIdForUniqueId(userUniqueId);

        if (registeredUserId) {
            let isAdministrator: Boolean = await checkUserForRole(registeredUserId, 'Administrator');

            let whereOptions: { [key: string]: any } = { uniqueId };

            // Administrators can delete any post, regardless of whether they created it or not
            if (!isAdministrator) {
                whereOptions.registeredUserId = registeredUserId;
            }

            let postComment: PostCommentInstance | null = await models.PostComment.findOne({
                where: whereOptions,
                include: [
                    {
                        model: models.Post,
                        as: 'post',
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
                    },
                    {
                        model: models.PostComment,
                        as: 'parentComment',
                        attributes: [
                            'id',
                            'registeredUserId',
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

            if (postComment) {
                await postComment.destroy();

                let notificationIds: string[] = [];
                let post: PostInstance | undefined = postComment.post;

                if (post) {
                    let user: UserInstance | undefined = post.registeredUser;

                    if (user) {
                        notificationIds.push(user.uniqueId);
                    }
                }

                let parentComment: PostCommentInstance | undefined = postComment.parentComment;

                if (parentComment) {
                    let user: UserInstance | undefined = parentComment.registeredUser;
                    
                    if (user) {
                        if (!notificationIds[0] || notificationIds[0] !== user.uniqueId) {
                            notificationIds.push(user.uniqueId);
                        }
                    }
                }

                SocketHelper.notifyUsers(notificationIds, ClientConstants.SOCKET_EVENTS.NOTIFY_USER.DELETED_COMMENT);

                return true;
            }
        }
    }
    catch (err) {
        console.error(`Error deleting post comment (${uniqueId}) for user ${userUniqueId}:\n${err.message}`);
    }

    return false;
}

// The end date is used to prevent new comments from coming back and winding up inserted in a strange place in the list. If they want the latest comments, they'll have to refresh the page
export const getCommentsForPost = async function(userUniqueId: string, postUniqueId: string, endDate: Date | undefined, pageNumber: number | undefined): Promise<{comments: WebsiteBoilerplate.PostComment[], total: number}> {
    let comments: WebsiteBoilerplate.PostComment[] = [];
    let total: number = 0;

    try {
        let registeredUser: UserInstance | null = await getUserWithUniqueId(userUniqueId);

        // Validate that this user can actually view the post
        let postInfo: FeedViewInstance | null = await models.Views.FeedView.findOne({
            attributes: [
                'id'
            ],
            where: {
                userUniqueId,
                uniqueId: postUniqueId,
                postedOn: {
                    [Op.lte]: endDate || new Date(Date.now())
                }
            }
        });

        if (registeredUser && postInfo) {
            let isAdministrator: Boolean = await checkUserForRole(registeredUser.id!, 'Administrator');

            let parentCommentInclude: Array<any> = [
                {
                    model: models.User,
                    as: 'registeredUser',
                    attributes: [
                        'id'
                    ],
                    include: [
                        {
                            /* Include DisplayName only for parentComment previews */
                            model: models.DisplayName,
                            as: 'displayNames',
                            where: {
                                isActive: true
                            },
                            attributes: [
                                'displayName',
                                'displayNameIndex'
                            ]
                        }
                    ]
                }
            ];

            if (!isAdministrator) {
                parentCommentInclude.push({
                    model: models.UserBlock,
                    as: 'userBlocks',
                    on: {
                        [Op.or]: [
                            {
                                [Op.and]: [
                                    {
                                        'registered_user_id': {
                                            [Op.eq]: Sequelize.col('parentComment.registered_user_id')
                                        }
                                    },
                                    {
                                        'blocked_user_id': registeredUser.id!
                                    }
                                ]
                            },
                            {
                                [Op.and]: [
                                    {
                                        'blocked_user_id': {
                                            [Op.eq]: Sequelize.col('parentComment.registered_user_id')
                                        }
                                    },
                                    {
                                        'registered_user_id': registeredUser.id!
                                    }
                                ]
                            }
                        ]
                    }
                });
            }

            let postCommentInclude: Array<any> = [
                {
                    model: models.User,
                    as: 'registeredUser',
                    attributes: [
                        'id',
                        'profileName',
                        'uniqueId'
                    ],
                    include: [
                        /* Include DisplayName and ProfilePicture for top-level comments */
                        {
                            model: models.DisplayName,
                            as: 'displayNames',
                            where: {
                                isActive: true
                            },
                            attributes: [
                                'displayName',
                                'displayNameIndex'
                            ]
                        },
                        {
                            model: models.ProfilePicture,
                            as: 'profilePictures',
                            required: false,
                            on: {
                                id: {
                                    [Op.eq]: Sequelize.literal('(select `id` FROM `profile_picture` where `profile_picture`.`registered_user_id` = `registeredUser`.`id` order by `profile_picture`.`id` desc limit 1)')
                                }
                            },
                            attributes: [
                                'smallFileName'
                            ]
                        }
                    ]
                },
                {
                    model: models.PostComment,
                    as: 'parentComment',
                    required: false,
                    attributes: [
                        'commentText',
                        'uniqueId'
                    ],
                    include: parentCommentInclude
                }
            ];

            if (!isAdministrator) {
                postCommentInclude.push({
                    model: models.UserBlock,
                    as: 'userBlocks',
                    on: {
                        [Op.or]: [
                            {
                                [Op.and]: [
                                    {
                                        'registered_user_id': {
                                            [Op.eq]: Sequelize.col('PostComment.registered_user_id')
                                        }
                                    },
                                    {
                                        'blocked_user_id': registeredUser.id!
                                    }
                                ]
                            },
                            {
                                [Op.and]: [
                                    {
                                        'blocked_user_id': {
                                            [Op.eq]: Sequelize.col('PostComment.registered_user_id')
                                        }
                                    },
                                    {
                                        'registered_user_id': registeredUser.id!
                                    }
                                ]
                            }
                        ]
                    }
                });
            }

            const {rows, count}: {rows: PostCommentInstance[]; count: number} = await models.PostComment.findAndCountAll({
                where: {
                    postId: postInfo.id!
                },
                order: [
                    ['id', 'DESC']
                ],
                include: postCommentInclude,
                offset: (pageNumber || 0) * ServerConstants.DB_COMMENT_FETCH_PAGE_SIZE,
                limit: ServerConstants.DB_COMMENT_FETCH_PAGE_SIZE,
                subQuery: false // See subquery note
            });

            comments = rows.map(row => {
                let commenter: UserInstance = row.registeredUser!;
                let displayNames: DisplayNameInstance[] = commenter.displayNames!;
                let pfps: ProfilePictureInstance[] | undefined = commenter.profilePictures;
                let parentComment: {
                    commentText: string;
                    postedBy: {
                        displayName: string;
                        displayNameIndex: number;
                    };
                    uniqueId: string;
                } | undefined = row.parentCommentId /* If there's no parent comment, but there's a parent comment id, then the parent comment was deleted */
                    ? {
                        commentText: '{This Comment Not Available}',
                        postedBy: {
                            /* Do not display the user's name */
                            displayName: '',
                            /* A value of 0 will keep the #index from displaying */
                            displayNameIndex: 0
                        },
                        uniqueId: ''
                    }
                    : undefined;

                let posterBlocked: Boolean = false;

                if (row.userBlocks && row.userBlocks[0]) {
                    posterBlocked = true;
                }

                if (row.parentComment) {
                    let tempComment: PostCommentInstance = row.parentComment;
                    let parentCommenter: UserInstance = tempComment.registeredUser!;
                    let parentDisplayNames: DisplayNameInstance[] = parentCommenter.displayNames!;

                    // If there are no blocks on the parent comment
                    if (!(tempComment.userBlocks && tempComment.userBlocks[0])) {
                        // then we can fill in the parent comment with the actual data
                        parentComment = {
                            commentText: tempComment.commentText,
                            postedBy: {
                                displayName: parentDisplayNames[0].displayName,
                                displayNameIndex: parentDisplayNames[0].displayNameIndex
                            },
                            uniqueId: tempComment.uniqueId
                        };
                    }
                }

                return {
                    canDelete: userUniqueId === commenter.uniqueId,
                    commentText: posterBlocked ? '{This Comment Not Available}' : row.commentText,
                    parentComment,
                    postedBy: {
                        /* Do not display the user's name */
                        displayName: posterBlocked ? '' : displayNames[0].displayName,
                        /* A value of 0 will keep the #index from displaying */
                        displayNameIndex: posterBlocked ? 0 : displayNames[0].displayNameIndex,
                        /* Display the default pfp if blocked */
                        pfpSmall: !posterBlocked && pfps && pfps[0] ? `${ClientConstants.PUBLIC_USER_PATH}${commenter.uniqueId}/${pfps[0].smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`,
                        profileName: posterBlocked ? '' : commenter.profileName,
                        uniqueId: posterBlocked ? '' : commenter.uniqueId
                    },
                    uniqueId: row.uniqueId
                };
            });

            total = count;
        }
    }
    catch (err) {
        console.error(`Error looking up comments for post:\n${err.message}`);
    }

    return {comments, total};
}
