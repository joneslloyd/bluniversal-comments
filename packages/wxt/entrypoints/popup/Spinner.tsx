import React from "react";

interface SpinnerProps {
  loadingText: string;
  show: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ loadingText, show }) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 1)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <p>{loadingText}</p>
    </div>
  );
};

export default Spinner;
