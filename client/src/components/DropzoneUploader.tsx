import { useError } from '@/context/ErrorContext';
import { useCallback, useState } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { FileType } from './not_components';

const DropzoneUploader = ({
  setFiles,
  fileType,
}: {
  setFiles: (files: File[]) => void;
  fileType: FileType;
}) => {
  const [files, setLocalFiles] = useState<File[] | null>(null);
  const { showError } = useError();

  const allowedTypes = (fileType: FileType) => {
    switch (fileType) {
      case FileType.Photo: {
        return ['image/jpeg', 'image/png'];
      }
      case FileType.Video: {
        return ['video/mp4', 'video/avi', 'video/quicktime'];
      }
      case FileType.Audio: {
        return ['audio/mpeg', 'audio/wav', 'audio/ogg'];
      }
    }
  };

  const allowedTypesForDegenerat = (
    fileType: FileType,
  ): { [key: string]: string[] } => {
    switch (fileType) {
      case FileType.Photo:
        return {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
        };
      case FileType.Video:
        return {
          'video/mp4': ['.mp4'],
          'video/avi': ['.avi'],
          'video/quicktime': ['.mov'],
        };
      case FileType.Audio:
        return {
          'audio/mpeg': ['.mp3'],
          'audio/wav': ['.wav'],
          'audio/ogg': ['.ogg'],
        };
    }
  };

  const allowedTypesBeautiful = (fileType: FileType) => {
    switch (fileType) {
      case FileType.Photo:
        return ['.jpeg', '.jpg', '.png'];
      case FileType.Video:
        return ['.mp4', '.avi', '.mov'];
      case FileType.Audio:
        return ['.mp3', '.wav', '.ogg'];
    }
  };

  const handleDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      const filteredFiles = acceptedFiles.filter((file: FileWithPath) =>
        allowedTypes(fileType).includes(file.type),
      );

      if (filteredFiles.length !== acceptedFiles.length) {
        showError('Один або кілька файлів мають неправильний формат!', 'error');
      }

      if (fileType === FileType.Photo && acceptedFiles.length > 10) {
        showError('Більше 10 фото завантажувати не можна!', 'error');
        return;
      } else if (fileType === FileType.Audio && acceptedFiles.length > 5) {
        showError('Більше 5 аудіо завантажувати не можна!', 'error');
        return;
      } else if (fileType === FileType.Video && acceptedFiles.length > 5) {
        showError('Більше 5 відео завантажувати не можна!', 'error');
        return;
      }

      setFiles(filteredFiles); // Передаємо лише файли з правильним форматом
      setLocalFiles(filteredFiles);
    },
    [fileType, showError, setFiles],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: allowedTypesForDegenerat(fileType),
  });

  return (
    <div
      {...getRootProps()}
      className='rounded-lg border-2 border-dashed p-6 text-center'
    >
      <input {...getInputProps()} />
      <p>Перетягни файл сюди або натисни, щоб вибрати</p>
      <p>Доступні формати: {allowedTypesBeautiful(fileType).join(', ')}</p>
      {files && <p>Вибрано файлів: {files.length}</p>}
    </div>
  );
};

export default DropzoneUploader;
