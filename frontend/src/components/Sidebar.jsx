import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import UserSearch from "./search/UserSearch";
import useChatStore from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";

const MIN_WIDTH_LG = 200;
const MAX_WIDTH_LG = 500;
const DEFAULT_WIDTH_LG = 288;

function SideBar() {
    const {
        conversationPartners,
        isContactsLoading,
        fetchConversationPartners,
        selectedUser,
        setSelectedUser,
    } = useChatStore();
    const { onlineUsers, authUser } = useAuthStore();

    const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH_LG);
    const isResizing = useRef(false);
    const sidebarRef = useRef(null);
    const [isMobileWidth, setIsMobileWidth] = useState(
        window.innerWidth < 1024
    ); // Состояние для ширины

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
        fetchConversationPartners();
    }, [fetchConversationPartners]);

    // ---  Фильтруем список контактов для отображения ---
    const filteredPartners = conversationPartners.filter((partner) => {
        // Исключаем себя из списка в любом случае
        if (partner._id === authUser?._id) return false;
        // Если чекбокс включен, показываем только онлайн
        if (showOnlineOnly) {
            return onlineUsers.includes(partner._id);
        }
        // Иначе показываем всех (кроме себя)
        return true;
    });

    // --- Считаем онлайн для счетчика из *всех* партнеров (кроме себя) ---
    const onlineCount = conversationPartners.filter(
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

    const memoizedStartResizing = useCallback(startResizing, [startResizing]); // Зависимость от startResizing

    useEffect(() => {
        return () => {
            stopResizing(); // Вызываем stopResizing для очистки
        };
    }, [stopResizing]); // Зависимость от stopResizing

    return (
        <aside
            ref={sidebarRef}
            className={`h-full border-r border-base-300 flex flex-col flex-shrink-0 bg-base-100 lg:rounded-l-lg relative transition-none ${
                // --- ИЗМЕНЕНО: Уточнена логика скрытия/показа ---
                selectedUser && isMobileWidth ? "hidden" : "flex" // Скрываем только на мобильных если выбран юзер
            } ${
                // --- ИЗМЕНЕНО: Уточнена логика ширины ---
                isMobileWidth ? "w-full" : "lg:flex" // w-full на мобильных, lg:flex для десктопа (ширина через style)
            }`}
            // Применяем ширину: 100% если isMobileWidth, иначе динамическую sidebarWidth
            style={!isMobileWidth ? { width: `${sidebarWidth}px` } : {}} // Применяем style только не на мобильных
        >
            <div className="flex flex-col h-full overflow-hidden">
                {/* Поиск */}
                <div className="p-2 border-b border-base-300 flex-shrink-0">
                    <UserSearch />
                </div>

                {/* --- Заголовок, счетчик и чекбокс --- */}
                <div className="p-3 border-b border-base-300 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
                    {/* Заголовок */}
                    <div className="flex items-center gap-2 text-base-content/80 overflow-hidden flex-shrink-0">
                        <MessageSquare className="w-5 h-5 flex-shrink-0" />
                        <span className="text-md font-semibold">All Chats</span>
                    </div>
                    {/* Правая часть: Счетчик и чекбокс */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Счетчик онлайн */}
                        <span
                            className={`text-xs font-medium whitespace-nowrap ${
                                onlineCount > 0
                                    ? "text-success"
                                    : "text-base-content/60" // Динамический цвет
                            }`}
                        >
                            {onlineCount} online
                        </span>
                        {/* Чекбокс "Show online only" */}
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
                                Show online
                            </span>
                        </label>
                    </div>
                </div>

                {/* Список чатов */}
                <div className="flex-1 overflow-y-auto py-1">
                    {isContactsLoading ? (
                        <SidebarSkeleton count={5} />
                    ) : filteredPartners.length > 0 ? (
                        filteredPartners.map((partner) => (
                            <button
                                key={partner._id}
                                onClick={() => setSelectedUser(partner)}
                                className={`w-full p-2 lg:p-3 flex items-center gap-3 hover:bg-base-300 focus:bg-base-300 outline-none transition-colors duration-150 ${
                                    selectedUser?._id === partner._id
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
                                            alt={partner.fullName}
                                        />
                                    </div>
                                </div>
                                {/* Детали видны всегда */}
                                <div className="text-left min-w-0 flex-1">
                                    <div className="font-medium truncate text-sm text-base-content">
                                        {partner.fullName}
                                    </div>
                                    {/* Статус текстом можно убрать, т.к. есть индикатор аватара */}
                                    <div className="text-xs text-base-content/60">
                                        {onlineUsers.includes(partner._id)
                                            ? "Online"
                                            : "Offline"}
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        // --- Сообщение при пустом списке ---
                        <div className="text-center text-xs text-base-content/50 py-4 px-2 block">
                            {showOnlineOnly
                                ? "No online users found."
                                : conversationPartners.length === 0
                                ? "Search for users to start chatting."
                                : "No users match the current filter."}
                        </div>
                    )}
                </div>
            </div>

            {/* Ручка ресайза видна только на lg+ */}
            <div
                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-primary/20 active:bg-primary/30 transition-colors duration-150 z-10 hidden lg:block"
                onMouseDown={memoizedStartResizing}
                title="Resize sidebar"
            />
        </aside>
    );
}

export default SideBar;
