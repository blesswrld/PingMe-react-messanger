import React from "react";
import useChatStore from "../../store/useChatStore";

const UserListItem = ({ user, onUserSelect }) => {
    const { setSelectedUser } = useChatStore();

    const handleClick = () => {
        setSelectedUser(user);
        if (onUserSelect) {
            onUserSelect();
        }
    };

    return (
        <li>
            <button
                className="flex items-center w-full p-2 hover:bg-base-300 focus:bg-base-300 rounded-md cursor-pointer transition-colors duration-150 outline-none text-left"
                onClick={handleClick}
            >
                <div className="avatar mr-2 flex-shrink-0">
                    <div className="w-8 rounded-full">
                        <img
                            src={user.profilePic || "/avatar.png"}
                            alt={`${user.fullName}'s profile`}
                        />
                    </div>
                </div>
                <span className="font-medium text-sm text-base-content truncate">
                    {user.fullName}
                </span>
            </button>
        </li>
    );
};

export default UserListItem;
