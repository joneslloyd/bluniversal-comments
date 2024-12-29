import React, { useEffect, useState, ReactNode } from "react";
import * as amplitude from "@amplitude/analytics-browser";

interface ModalContainerProps {
  children: ReactNode;
}

const ModalContainer: React.FC<ModalContainerProps> = ({ children }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkInstallDuration = async () => {
      const {
        "bluniversalComments:installTime": installTime,
        "bluniversalComments:modalDismissed": modalDismissed,
      } = await browser.storage.local.get([
        "bluniversalComments:installTime",
        "bluniversalComments:modalDismissed",
      ]);
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000;
      const isDevMode = import.meta.env.MODE === "development";
      if (
        installTime &&
        (currentTime - installTime > oneHour ||
          (isDevMode && currentTime - installTime > 0.5 * 60 * 1000)) &&
        !modalDismissed
      ) {
        setShowModal(true);
      }
    };

    checkInstallDuration();
  }, []);

  const handleCloseModal = () => {
    amplitude.logEvent("PLG Modal: Dismiss Message Clicked");
    setShowModal(false);
    browser.storage.local.set({ ["bluniversalComments:modalDismissed"]: true });
  };

  const handleSendMessage = () => {
    amplitude.logEvent("PLG Modal: Send Message Clicked");
    setShowModal(false);
    browser.storage.local.set({ ["bluniversalComments:modalDismissed"]: true });
  };

  return (
    <>
      {showModal &&
        React.cloneElement(children as React.ReactElement<any>, {
          onClose: handleCloseModal,
          onSend: handleSendMessage,
        })}
    </>
  );
};

export default ModalContainer;
