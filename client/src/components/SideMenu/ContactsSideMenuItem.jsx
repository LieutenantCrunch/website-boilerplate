import React, {useEffect, useState, useRef} from 'react';
import classNames from 'classnames';
import UserService from '../../services/user.service';

export default function ContactsSideMenuItem(props) {
    const [state, updateState] = useState({
        expanded: false,
        contacts: []
    })

    const getContacts = () => {
        let contacts = await UserService.getContacts(props.userDetails.uniqueID);

        return contacts;
    };

    const toggleExpanded = () => {
        if (!state.expanded) {
            let contacts = getContacts();

            updateState(prevState => ({...prevState, expanded: true, contacts}));
        }
        else {
            updateState(prevState => ({...prevState, expanded: false}));
        }
    }

    return (
        <div className={classNames('sideMenuItem', {'sideMenuItemExpanded': state.expanded})}
            onClick={toggleExpanded}
        >
            <div className="sideMenuItemTab"></div>
            <div className="sideMenuItemDetails">
                <div className="sideMenuItemTitle">
                    <h4 className="sideMenuItemText">Contacts</h4>
                    <div className="sideMenuItemIcon"></div>
                </div>
                <div className="sideMenuItemContent">
                    <ul className="sideMenuItemList">
                        {
                            state.contacts.map(contact => {
                                return (
                                    <li className="sideMnuItemListItem" key={contact.uniqueID}>
                                        <span className="sideMenuItemListItemText">
                                            {contact.displayName}
                                        </span>
                                    </li>
                                );
                            })
                        }
                    </ul>
                </div>
            </div>
        </div>
    );
}