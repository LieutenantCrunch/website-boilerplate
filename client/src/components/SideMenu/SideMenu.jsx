import React, {useEffect, useState, useRef} from 'react';
import ConnectionsSideMenuItem from './ConnectionsSideMenuItem';

export default function SideMenu(props) {

    return <>
        <ConnectionsSideMenuItem userDetails={props.userDetails} appState={props.appState} />
    </>;
}