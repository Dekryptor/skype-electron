class FrameSinkProxy {
    constructor(bufferName) {
        this.bufferName = bufferName;
    }
    dispose() {
    }
    getBufferName() {
        return this.bufferName;
    }
    setVideoPreference(width, height) {
        sendMessage('setVideoPreference', { width, height });
    }
}
const avatarImage = document.getElementById('avatarImage');
const avatarIcon = document.getElementById('avatarIcon');
const microphoneButton = document.getElementById('microphone');
const endCallButton = document.getElementById('callEnd');
const videoButton = document.getElementById('video');
const closeButton = document.getElementById('close');
const state = {
    avatarUrl: null,
    isGroupCall: false,
    isPstnCall: false,
    microphoneOn: true,
    videoOn: false,
    canStartAudio: true,
    canStartVideo: true,
    translations: {
        mute: null,
        unmute: null,
        videoStart: null,
        videoEnd: null,
        endCall: null
    }
};
let renderer;
const init = () => {
    if (!window['popupApi'].supportsTransparency()) {
        document.body.classList.add('noTransparency');
    }
    addClickEvent(microphoneButton, handleMicrophone);
    addClickEvent(endCallButton, handleEndCall);
    addClickEvent(videoButton, handleCamera);
    addClickEvent(closeButton, handleClose);
    document.body.addEventListener('dblclick', () => sendMessage('navigateToCall'));
    window['popupApi'].onMessage(onNewMessage);
    sendMessage('ready');
};
const onNewMessage = (name, ...args) => {
    console.log(`[CallMonitorPopup] received message: ${name} argument: ${JSON.stringify(args[0])}`);
    const handler = {
        conversationUpdated: onConversationUpdated,
        AVCapabilitiesUpdated: onAVCapabilitiesUpdated,
        translationsUpdated: onTranslationsUpdated,
        isMuted: onMuteChange,
        isVideoOn: onVideoChange,
        showVideo: (info) => {
            renderer = createRenderer(info ? info.bufferName : undefined);
        },
        stopVideo: destroyRenderer
    };
    if (handler.hasOwnProperty(name)) {
        handler[name](...args);
    }
    else {
        console.log(`[CallMonitorPopup] unhandled message: ${name}`);
    }
};
const handleEndCall = () => {
    sendMessage('endCall');
};
const handleMicrophone = () => {
    if (state.microphoneOn) {
        sendMessage('mute');
        setState('microphoneOn', false);
        setMicrophoneButtonOff();
    }
    else {
        sendMessage('unmute');
        setState('microphoneOn', true);
        setMicrophoneButtonOn();
    }
};
const handleCamera = () => {
    if (state.videoOn) {
        sendMessage('videoStop');
        setState('videoOn', false);
        setVideoButtonOff();
    }
    else {
        sendMessage('videoStart');
        setState('videoOn', true);
        setVideoButtonOn();
    }
};
const handleClose = () => {
    sendMessage('close');
};
const onConversationUpdated = (conversationData) => {
    setState('avatarUrl', conversationData.avatarUrl);
    setState('isGroupCall', conversationData.isGroupCall);
    setState('isPSTNCall', conversationData.isPstnCall);
    if (state.avatarUrl) {
        updateAvatar();
    }
    if (state.isPstnCall && !state.isGroupCall) {
        updateAvatarToPSTN();
    }
    else if (state.isGroupCall) {
        updateAvatarToGroup();
    }
};
const onAVCapabilitiesUpdated = (AVCapabilities) => {
    setState('canStartAudio', AVCapabilities.canStartAudio);
    setState('canStartVideo', AVCapabilities.canStartVideo);
    if (state.canStartAudio) {
        enableMicrophoneButton();
    }
    else {
        disableMicrophoneButton();
    }
    if (state.canStartVideo) {
        enableVideoButton();
    }
    else {
        disableVideoButton();
    }
};
const onMuteChange = (isMuted) => {
    if (isMuted) {
        setMicrophoneButtonOff();
    }
    else {
        setMicrophoneButtonOn();
    }
    setState('microphoneOn', !isMuted);
};
const onVideoChange = (isVideoOn) => {
    if (isVideoOn) {
        setVideoButtonOn();
    }
    else {
        setVideoButtonOff();
    }
    setState('videoOn', isVideoOn);
};
const onTranslationsUpdated = (translations) => {
    setState('translations', translations);
    setButtonTitle(endCallButton, translations.endCall);
    setButtonTitle(closeButton, translations.close);
    if (state.microphoneOn) {
        setButtonTitle(microphoneButton, translations.mute);
    }
    else {
        setButtonTitle(microphoneButton, translations.unmute);
    }
    if (state.videoOn) {
        setButtonTitle(videoButton, translations.videoEnd);
    }
    else {
        setButtonTitle(videoButton, translations.videoStart);
    }
};
const createRenderer = (bufferName) => {
    try {
        destroyRenderer();
        const vr = window['popupApi'].videoRenderer;
        const videoContainer = document.querySelector(".videoContainer");
        if (vr && bufferName && videoContainer) {
            const sink = new FrameSinkProxy(bufferName);
            return vr.createPepperVideoRenderer(sink, { container: videoContainer, transparent: true, useCropInfo: true, scalingMode: 1 });
        }
    }
    catch (e) {
        console.error(`[CallMonitorPopup] Failed to create pepper renderer: ${e}`);
        sendMessage('errorReport', `Failed to create pepper renderer: ${e}`);
    }
    return undefined;
};
const destroyRenderer = () => {
    if (renderer) {
        renderer.dispose();
        renderer = undefined;
    }
};
const setState = (key, value) => {
    state[key] = value;
};
const sendMessage = (name, ...args) => {
    window['popupApi'].sendMessage(name, ...args);
};
const addClickEvent = (button, handler) => {
    button.addEventListener('click', handler);
};
const updateAvatar = () => {
    avatarImage.style.backgroundImage = 'url(' + state.avatarUrl + ')';
};
const updateAvatarToPSTN = () => {
    setButtonClass(avatarIcon, 'oneToOne', 'pstn');
};
const updateAvatarToGroup = () => {
    setButtonClass(avatarIcon, 'oneToOne', 'group');
};
const enableMicrophoneButton = () => {
    microphoneButton.removeAttribute('disabled');
};
const disableMicrophoneButton = () => {
    microphoneButton.setAttribute('disabled', 'disabled');
};
const enableVideoButton = () => {
    videoButton.removeAttribute('disabled');
};
const disableVideoButton = () => {
    videoButton.setAttribute('disabled', 'disabled');
};
const setButtonClass = (button, classToRemove, classToAdd) => {
    button.classList.remove(classToRemove);
    button.classList.add(classToAdd);
};
const setMicrophoneButtonOn = () => {
    setButtonClass(microphoneButton, 'microphoneOff', 'microphoneOn');
    setButtonTitle(microphoneButton, state.translations.mute);
};
const setMicrophoneButtonOff = () => {
    setButtonClass(microphoneButton, 'microphoneOn', 'microphoneOff');
    setButtonTitle(microphoneButton, state.translations.unmute);
};
const setVideoButtonOn = () => {
    setButtonClass(videoButton, 'videoOff', 'videoOn');
    setButtonTitle(videoButton, state.translations.videoEnd);
};
const setVideoButtonOff = () => {
    setButtonClass(videoButton, 'videoOn', 'videoOff');
    setButtonTitle(videoButton, state.translations.videoStart);
};
const setButtonTitle = (button, title) => {
    button.setAttribute('title', title);
    button.querySelector('.title').textContent = title;
};
init();
