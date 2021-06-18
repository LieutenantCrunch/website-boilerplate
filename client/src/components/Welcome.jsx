import React, {useEffect} from 'react';

// Material UI
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

export const Welcome = ({ setTitle }) => {
    useEffect(() => {
        setTitle('Welcome!')
    }, []);

    return (
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mt-2 align-middle text-center">
            <Card>
                <CardHeader
                    title={
                        <Typography variant="h5">
                            Welcome!
                        </Typography>
                    }
                />
                <CardContent>
                    <Typography variant="h6">
                        What is this place?
                    </Typography>
                    <Typography gutterBottom>
                        A website built by one man in an effort to learn React, Redux, and other various modern web development technologies.
                        It acts as a basic social media platform, allowing users to connect and post content.
                    </Typography>
                    <Typography variant="h6">
                        Can I register an account on here and use the website?
                    </Typography>
                    <Typography gutterBottom>
                        Sure, if you really want to, <em>but I currently recommend against it</em>. Please read the <a href="/terms">Terms of Service</a>.
                    </Typography>
                    <Typography variant="h6">
                        I'm a recruiter and would like to set up an interview.
                    </Typography>
                    <Typography gutterBottom>
                        If that's the case, hopefully you've reached this site via my resume or LinkedIn and have my contact details. If not, go ahead and register on the site and add Admin as a connection.
                    </Typography>
                    <Typography variant="h6">
                        Why doesn't the site have x feature?
                    </Typography>
                    <Typography gutterBottom>
                        I'd like to add more features to this site, and am planning on adding them eventually. I'm currently building the website own my own for free though, so it's all a matter of what I have time for and can figure out.
                    </Typography>
                </CardContent>
            </Card>
        </div>
    );
};
