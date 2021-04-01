//import fs from 'fs';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SendmailTransport from 'nodemailer/lib/sendmail-transport';
import * as ServerConstants from '../constants/constants.server';

export default class EmailHelper {
    private static instance: EmailHelper;

    #wasInitialized: Boolean = false;
    #testMode: Boolean = false;
    #testAccount: nodemailer.TestAccount;
    #transporter: Mail;

    constructor() {
        if (EmailHelper.instance) {
            return EmailHelper.instance;
        }

        EmailHelper.instance = this;

        /* // Future: Read details from file system
        fs.readFile('./private/emailpass.txt', 'utf8', (readFileError: NodeJS.ErrnoException | null, data: string) => {
            if (readFileError) {
                console.error(readFileError);
            }
    
            //password: data.trim(),
        });*/
    };

    async initialize(testMode: Boolean = false): Promise<EmailHelper | null> {
        if (this.#wasInitialized) {
            return this;
        }

        if (testMode === true) {
            this.#testMode = true;
        }

        if (this.#testMode) {
            this.#testAccount = await nodemailer.createTestAccount();
            this.#transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: this.#testAccount.user,
                    pass: this.#testAccount.pass
                }
            });

            this.#wasInitialized = true;

            return this;
        }
        else {
            // Temporary error until this is implemented
            console.error('Non-test mode is not currently supported');
            return null;
        }
    };

    async sendMail(mailOptions: SendmailTransport.MailOptions): Promise<Boolean> {
        if (!this.#wasInitialized) {
            if (!await this.initialize(true)) {
                return false;
            }
        }

        if (!mailOptions.from) {
            mailOptions.from = ServerConstants.EMAIL_FROM;
        }

        try {
            let info = await this.#transporter!.sendMail(mailOptions);

            console.log(`Successfully sent mail: ${info.messageId}`);
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);

            return true;
        }
        catch (err) {
            console.error(`Error sending mail: ${err.message}`);

            return false;
        }
    }
};