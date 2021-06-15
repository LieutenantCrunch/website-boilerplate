import { models } from '../../../models/_index';

import { PostFileInstance } from '../../../models/PostFile';

export const updateThumbnailForPostFile = async function(postId: number, thumbnailFileName: string) {
    try {
        let postFile: PostFileInstance | null = await models.PostFile.findOne({
            where: {
                postId
            }
        });

        if (postFile) {
            postFile.thumbnailFileName = thumbnailFileName;
            await postFile.save();
        }
    }
    catch (err) {
        console.error(`Error updating thumbnail for postFile:\n${err.message}`);
    }
}
