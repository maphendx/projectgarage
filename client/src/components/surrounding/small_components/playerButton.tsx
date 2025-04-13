const PlayerButton = ({
  onClick,
  iconClass,
}: {
  onClick?: () => void;
  iconClass: string;
}) => {
  // кнопочка для плеєра
  return (
    <button className='text-gray-400 hover:text-white' onClick={onClick}>
      <i className={iconClass}></i>
    </button>
  );
};

export default PlayerButton;
