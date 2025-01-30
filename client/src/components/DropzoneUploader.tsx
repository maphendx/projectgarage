import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const DropzoneUploader = ({setFiles} : {setFiles : (files : File[]) => void}) => {
    const [files, setLocalFiles] = useState<File[] | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles); // Беремо перший файл
        setLocalFiles(acceptedFiles); 
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
        <div {...getRootProps()} className="p-6 border-2 border-dashed rounded-lg text-center">
            <input {...getInputProps()} />
            <p>Перетягни файл сюди або натисни, щоб вибрати</p>
            {files && <p>Вибрано файлів: {files.length}</p>}
        </div>
    );
}

export default DropzoneUploader;