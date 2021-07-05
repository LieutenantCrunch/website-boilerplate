import { fromFile, FileTypeResult } from 'file-type';
import fs from 'fs/promises';
import * as tf from '@tensorflow/tfjs-node';
import * as nsfwjs from 'nsfwjs';
import path from 'path';
import sharp, { Metadata, Sharp } from 'sharp';

tf.enableProdMode();

// Ideally this should be offloaded to a separate process to keep the UI snappy
export class NSFWJSHelper {
    static isLoaded: Boolean = false;
    private static _model: nsfwjs.NSFWJS | undefined = undefined;

    private static async convertImage (imagePath: string): Promise<tf.Tensor3D | undefined> {
        try {
            //let baseImage: Sharp = sharp(image.path).toColorspace('srgb').removeAlpha();
            let baseImage: Sharp = sharp(imagePath).toColorspace('srgb').removeAlpha().resize({
                width: 299,
                height: 299,
                fit: sharp.fit.fill
            });
            let rawImage: Sharp = baseImage.raw();
            let metadata: Metadata = await baseImage.metadata();

            if (metadata.height && metadata.width) {
                let imageBuffer: Buffer = await rawImage.toBuffer();
                let imageValues: Int32Array = new Int32Array(imageBuffer);

                return tf.tensor3d(imageValues, [299, 299, 3], 'int32');
                //return tf.tensor3d(imageValues, [metadata.width, metadata.height, 3], 'int32');
            }
        }
        catch (err) {
            console.error(`Error converting image to tensor:\n${err.message}`);
        }

        return undefined;
    }

    static async load(): Promise<void> {
        if (!NSFWJSHelper.isLoaded || !NSFWJSHelper._model) {
            try {
                let modelPath: string = `file://${path.resolve('nsfwjs').replace(/\\/g, '/')}/`;

                //NSFWJSHelper._model = await nsfwjs.load(modelPath, { type: 'graph' });
                NSFWJSHelper._model = await nsfwjs.load(modelPath, { size: 299 });
                NSFWJSHelper.isLoaded = true;
            }
            catch (err) {
                throw err;
            }
        }

        return;
    }

    static async processImage(imagePath: string): Promise<number> {
        try {
            if (NSFWJSHelper.isLoaded && NSFWJSHelper._model) {
                let result: FileTypeResult | undefined = await fromFile(imagePath);
                let className: string = 'Neutral';

                if (result && result.mime === 'image/gif') {
                    ; // Skip for now for performance

                    /*
                    let imageBuffer: Buffer = await fs.readFile(imagePath);
                    let predictionsArray: nsfwjs.predictionType[][] = await NSFWJSHelper._model.classifyGif(imageBuffer, {
                        topk: 1,
                        fps: 1
                    });

                    if (predictionsArray.length > 0) {
                        let currentMax: number = 0;

                        for (let predictions of predictionsArray) {
                            if (predictions[0]) {
                                let prediction: nsfwjs.predictionType = predictions[0];
                                let currentValue: number = 0;
                                let currentClassName: string = 'Neutral';

                                switch (prediction.className) {
                                    case 'Porn':
                                        currentValue = 3;
                                        break;
                                    case 'Sexy':
                                        currentValue = 2;
                                        break;
                                    case 'Hentai':
                                        currentValue = 1;
                                        break;
                                    case 'Drawing':
                                    case 'Neutral':
                                    default:
                                        currentValue = 0;
                                        break;
                                }

                                if (currentValue > currentMax) {
                                    currentMax = currentValue;
                                    className = currentClassName;
                                }
                            }
                        }
                    }
                    */
                }
                else {
                    let tensor: tf.Tensor3D | undefined = await NSFWJSHelper.convertImage(imagePath);

                    if (tensor) {
                        let predictions: nsfwjs.predictionType[] = await NSFWJSHelper._model.classify(tensor, 1);

                        tensor.dispose();

                        if (predictions[0]) {
                            let prediction: nsfwjs.predictionType = predictions[0];
                            className = prediction.className;
                        }
                    }
                }

                switch (className) {
                    case 'Porn':
                        return 3;
                    case 'Sexy':
                        return 2;
                    case 'Hentai':
                        return 1;
                    case 'Drawing':
                    case 'Neutral':
                    default:
                        return 0;
                }
            }
        }
        catch (err) {
            console.error(`Error processing image through NSFWJS:\n${err.message}`);
        }

        return 0;
    }
};
