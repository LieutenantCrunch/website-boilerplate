import React, {useEffect, useState, useRef} from 'react';
import ContactsSideMenuItem from './ContactsSideMenuItem';

export default function SideMenu(props) {

    return <>
        <ContactsSideMenuItem userDetails={props.userDetails} />
    </>;
}