import React, { useEffect, useState, ReactNode } from "react";

interface ModalContainerProps {
  children: ReactNode;
}

const ModalContainer: React.FC<ModalContainerProps> = ({ children }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkInstallDuration = async () => {
      const { installTime, modalDismissed } = await browser.storage.local.get([
        "installTime",
        "modalDismissed",
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
    setShowModal(false);
    browser.storage.local.set({ modalDismissed: true });
  };

  return (
    <>
      {showModal &&
        React.cloneElement(children as React.ReactElement<any>, {
          onClose: handleCloseModal,
        })}
    </>
  );
};

export default ModalContainer;
