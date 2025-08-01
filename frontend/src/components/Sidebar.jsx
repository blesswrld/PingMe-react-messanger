import React, { useState, useEffect, useRef, useCallback } from "react";
import { Image, MessageSquare, Video } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import UserSearch from "./search/UserSearch";
import useChatStore from "../store/useChatStore"; // Correct import
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { useTranslation } from "react-i18next";

const MIN_WIDTH_LG = 200;
const MAX_WIDTH_LG = 500;
const DEFAULT_WIDTH_LG = 288;

function SideBar() {
    const { t } = useTranslation();
    const chatStore = useChatStore();
    const { onlineUsers, authUser } = useAuthStore();
    const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH_LG);
    const isResizing = useRef(false);
    const sidebarRef = useRef(null);
    const [isMobileWidth, setIsMobileWidth] = useState(
        window.innerWidth < 1024
    );

    // --- Состояние для чекбокса ---
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    // Обновляем isMobileWidth при изменении размера окна
    useEffect(() => {
        const handleResize = () => {
            setIsMobileWidth(window.innerWidth < 1024);
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (chatStore.fetchConversationPartners) {
            chatStore.fetchConversationPartners();
        }
    }, []);

    const filteredPartners = chatStore.conversationPartners.filter(
        (partner) => {
            if (partner._id === authUser?._id) return false;
            if (showOnlineOnly) {
                return onlineUsers.includes(partner._id);
            }
            return true;
        }
    );

    const onlineCount = chatStore.conversationPartners.filter(
        (partner) =>
            onlineUsers.includes(partner._id) && partner._id !== authUser?._id
    ).length;

    const startResizing = useCallback((mouseDownEvent) => {
        // Ресайз работает только если не мобильная или планшетная ширина
        if (window.innerWidth >= 1024) {
            isResizing.current = true;
            mouseDownEvent.preventDefault();
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }
    }, []);

    const stopResizing = useCallback(() => {
        if (isResizing.current) {
            isResizing.current = false;
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    }, []);

    const resize = useCallback((mouseMoveEvent) => {
        if (isResizing.current && sidebarRef.current) {
            const currentWidth =
                mouseMoveEvent.clientX -
                sidebarRef.current.getBoundingClientRect().left;
            const newWidth = Math.max(
                MIN_WIDTH_LG,
                Math.min(currentWidth, MAX_WIDTH_LG)
            );
            setSidebarWidth(newWidth);
        }
    }, []);

    const memoizedStartResizing = useCallback(startResizing, [startResizing]);

    useEffect(() => {
        return () => {
            stopResizing();
        };
    }, [stopResizing]);

    const renderMessagePreview = (message) => {
        if (!message) {
            return <span className="italic">{t("sidebar.noMessagesYet")}</span>;
        }

        const isMyMessage = authUser && message.senderId === authUser._id;
        const prefix = isMyMessage ? `${t("sidebar.you")}: ` : "";

        if (message.text) {
            return (
                <span className="truncate">
                    {prefix} {message.text}
                </span>
            );
        } else if (message.image) {
            return (
                <span className="flex items-center gap-1">
                    {prefix} <Image className="w-4 h-4" />
                    {t("sidebar.sentImage")}
                </span>
            );
        } else if (message.video) {
            return (
                <span className="flex items-center gap-1">
                    {prefix} <Video className="w-4 h-4" />
                    {t("sidebar.sentVideo")}
                </span>
            );
        }
        return null;
    };

    return (
        <aside
            ref={sidebarRef}
            className={`h-full border-r border-base-300 flex flex-col flex-shrink-0 bg-base-100 lg:rounded-l-lg relative transition-none ${
                chatStore.selectedUser && isMobileWidth ? "hidden" : "flex"
            } ${isMobileWidth ? "w-full" : "lg:flex"}`}
            style={!isMobileWidth ? { width: `${sidebarWidth}px` } : {}}
        >
            <div className="flex flex-col h-full overflow-hidden">
                <div className="p-2 border-b border-base-300 flex-shrink-0">
                    <UserSearch />
                </div>
                <div className="p-3 border-b border-base-300 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 text-base-content/80 overflow-hidden flex-shrink-0">
                        <MessageSquare className="w-5 h-5 flex-shrink-0" />
                        <span className="text-md font-semibold">
                            {t("sidebar.allChats")}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                            className={`text-xs font-medium whitespace-nowrap ${
                                onlineCount > 0
                                    ? "text-success"
                                    : "text-base-content/60"
                            }`}
                        >
                            {t("sidebar.onlineCounter", { count: onlineCount })}
                        </span>
                        <label className="label cursor-pointer p-0 justify-start gap-1.5">
                            <input
                                type="checkbox"
                                checked={showOnlineOnly}
                                onChange={(e) =>
                                    setShowOnlineOnly(e.target.checked)
                                }
                                className="checkbox checkbox-primary checkbox-xs"
                            />
                            <span className="label-text text-xs text-base-content/70 whitespace-nowrap">
                                {t("sidebar.showOnline")}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-1">
                    {chatStore.isContactsLoading ? (
                        <SidebarSkeleton count={5} />
                    ) : filteredPartners.length > 0 ? (
                        filteredPartners.map((partner) => (
                            <button
                                key={partner._id}
                                onClick={() =>
                                    chatStore.setSelectedUser(partner)
                                }
                                className={`w-full p-2 lg:p-3 flex items-center gap-3 hover:bg-base-300 focus:bg-base-300 outline-none transition-colors duration-150 ${
                                    chatStore.selectedUser?._id === partner._id
                                        ? "bg-base-300 font-semibold"
                                        : ""
                                } `}
                            >
                                <div
                                    className={`avatar ${
                                        onlineUsers.includes(partner._id)
                                            ? "avatar-online"
                                            : "avatar-offline"
                                    } flex-shrink-0`}
                                >
                                    <div className="w-10 rounded-full">
                                        <img
                                            src={
                                                partner.profilePic ||
                                                "/avatar.png"
                                            }
                                            alt={t("sidebar.userProfileAlt", {
                                                name: partner.fullName,
                                            })}
                                        />
                                    </div>
                                </div>
                                {/* Детали видны всегда */}
                                <div className="text-left min-w-0 flex-1">
                                    <div className="font-medium truncate text-sm text-base-content flex items-center justify-between">
                                        <span className="truncate">
                                            {partner.fullName}
                                        </span>
                                        {partner.unreadCount > 0 && (
                                            <span className="badge badge-primary rounded">
                                                {partner.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-base-content/60 flex items-center gap-1">
                                        {renderMessagePreview(
                                            partner.lastMessage
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        // --- Сообщение при пустом списке ---
                        <div className="text-center text-xs text-base-content/50 py-4 px-2 block">
                            {showOnlineOnly
                                ? t("sidebar.noOnlineUsers")
                                : chatStore.conversationPartners.length === 0
                                ? t("sidebar.searchToStart")
                                : t("sidebar.noUsersMatchFilter")}
                        </div>
                    )}
                </div>
            </div>

            <div
                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-primary/20 active:bg-primary/30 transition-colors duration-150 z-10 hidden lg:block"
                onMouseDown={memoizedStartResizing}
                title={t("sidebar.resizeHandleTitle")}
            />
        </aside>
    );
}

export default SideBar;
