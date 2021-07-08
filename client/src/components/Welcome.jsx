import React, { useEffect, useState } from 'react';

// Material UI
import { makeStyles } from '@material-ui/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import FacebookIcon from '@material-ui/icons/Facebook'; // rgb(24,119,242)
// import PinterestIcon from '@material-ui/icons/Pinterest'; // rgb(230,0,35)
import TwitterIcon from '@material-ui/icons/Twitter'; // rgb(28,160,241)

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        backgroundColor: 'rgb(255,255,255)'
    },
    nested: {
        paddingLeft: '3em'
    },
}));

export const Welcome = ({ setTitle }) => {
    useEffect(() => {
        setTitle('Welcome!')
    }, []);

    const classes = useStyles();

    const [facebookOpen, setFacebookOpen] = useState(false);
    const [twitterOpen, setTwitterOpen] = useState(false);

    const handleFacebookClick = (e) => {
        setFacebookOpen(!facebookOpen);
    };

    const handleTwitterClick = (e) => {
        setTwitterOpen(!twitterOpen);
    };

    return (
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mt-2 align-middle text-center">
            <Card className="mb-2">
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
                    <Typography variant="h6">
                        What Advantages Does This Site Have Over Others?
                    </Typography>
                    <List className={classes.root}>
                        <Divider component="li" />
                        <ListItem button onClick={handleFacebookClick}>
                            <ListItemIcon>
                                <FacebookIcon style={{ color: 'rgb(24,119,242)' }} />
                            </ListItemIcon>
                            <ListItemText primary="Facebook" />
                            {facebookOpen ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={facebookOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem button className={classes.nested}>
                                    <ListItemText primary={
                                        <>
                                            <p>
                                                Did you know that by default, Facebook doesn't show you all of your friends' or liked pages' posts? Facebook uses an algorithm to determine what posts <em>they</em> think you want to see on your news feed. While you can change your news feed temporarily to show the most recent posts, it reverts back to the default feed quickly unless you make an effort to keep it recent.
                                            </p>
                                            <p>
                                                This site doesn't try to guess at what you want to see, it simply shows you everything your connections have posted. That way, you don't miss a single post, and you're in control of what you see.
                                            </p>
                                        </>
                                    } />
                                </ListItem>
                            </List>
                        </Collapse>
                        <Divider component="li" />
                        <ListItem button onClick={handleTwitterClick}>
                            <ListItemIcon>
                                <TwitterIcon style={{ color: 'rgb(28,160,241)' }} />
                            </ListItemIcon>
                            <ListItemText primary="Twitter" />
                            {twitterOpen ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={twitterOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem button className={classes.nested}>
                                    <ListItemText primary={
                                        <>
                                            <p>
                                                Did you know that you can't tell Twitter that you don't want to see liked Tweets from people you follow? While Twitter does allow you to turn off retweets, you can never turn off liked posts. That means if someone likes something you really didn't want to see, it could potentially show up on your feed. You can tell Twitter that you'd like to see <em>less</em> likes, and that will slow down the liked posts for a while, but eventually they'll pop right back up again.
                                            </p>
                                            <p>
                                                This site doesn't even have a feature to see liked posts! Actually, it might have that feature some day, but if/when it does, the default will be for them to be off, and you will be able to specify whether you want to see them.
                                            </p>
                                        </>
                                    } />
                                </ListItem>
                                <Divider variant="middle" component="li" />
                                <ListItem button className={classes.nested}>
                                    <ListItemText primary={
                                        <>
                                            <p>
                                                If you've used Twitter for a while, you may notice that they frequently add posts from recommended topics to your feed. While you can say that you're not interested in that topic, it won't stop Twitter from coming up with more topics you "might" want to follow and clogging your feed with posts from them.
                                            </p>
                                            <p>
                                                This site assumes you know what you want to see and that you'll go out looking for new things if/when you want to to see new things.
                                            </p>
                                        </>
                                    } />
                                </ListItem>
                            </List>
                        </Collapse>
                        <Divider component="li" />
                    </List>
                    <Typography variant="h6">
                        Do my photos and other files stay around even if I delete them?
                    </Typography>
                    <Typography gutterBottom>
                        When you delete something, I try my best to get rid of it. That's not to say it could be in a backup somewhere, but assuming there's no need to revert to a backup where it exists, it shouldn't come back.
                    </Typography>
                </CardContent>
            </Card>
        </div>
    );
};
