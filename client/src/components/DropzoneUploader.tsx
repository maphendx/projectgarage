import { useError } from "@/context/ErrorContext";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileType } from "./not_components";

const DropzoneUploader = ({setFiles, fileType} : {setFiles : (files : File[]) => void, fileType : FileType}) => {
    const [files, setLocalFiles] = useState<File[] | null>(null);
    const { showError } = useError();

    const allowedTypes = (fileType : FileType) => {
        switch (fileType) {
            case (FileType.Photo): {
                return ["image/jpeg", "image/png"];
            }
            case (FileType.Video): {
                return ["video/mp4", "video/avi", "video/quicktime"];
            }
            case (FileType.Audio): {
                return ["audio/mpeg", "audio/wav", "audio/ogg"];
            }
        }
    }

    const allowedTypesBeautiful = (fileType: FileType) => {
        switch (fileType) {
            case FileType.Photo:
                return [".jpeg", ".jpg", ".png"];
            case FileType.Video:
                return [".mp4", ".avi", ".mov"];
            case FileType.Audio:
                return [".mp3", ".wav", ".ogg"];
        }
    };
    

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const filteredFiles = acceptedFiles.filter(file => allowedTypes(fileType).includes(file.type));
    
        if (filteredFiles.length !== acceptedFiles.length) {
          showError("Один або кілька файлів мають неправильний формат!", "error");
        }

        setFiles(filteredFiles); // Передаємо лише файли з правильним форматом
        setLocalFiles(filteredFiles); 
      }, [setFiles]);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
        <div {...getRootProps()} className="p-6 border-2 border-dashed rounded-lg text-center">
            <input {...getInputProps()} />
            <p>Перетягни файл сюди або натисни, щоб вибрати</p>
            <p>Доступні формати: {allowedTypesBeautiful(fileType).join(",")}</p>
            {files && <p>Вибрано файлів: {files.length}</p>}
        </div>
    );
}

export default DropzoneUploader;