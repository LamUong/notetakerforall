import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function Drop({ onLoaded }) {
  const styles = {
    container: {
      textAlign: "center",
      border: "1px dotted",
      minHeight: "25vh",
      padding: 20,
      marginTop: 12,
      color: "hsl(218,49%,66%)",
      fontSize: 18,
      fontWeight: 600,
      borderRadius: 4,
      userSelect: "none",
      outline: 0,
      cursor: "pointer",
    },
  };

  const onDrop = useCallback((acceptedFiles) => {
    onLoaded(acceptedFiles);
    // Do something with the files
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "application/pdf",
  });

  return (
    <div {...getRootProps()} style={styles.container}>
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop a PDF here</p> : <p>Drag or Click Here to Upload a Video/Audio</p>}
    </div>
  );
}
