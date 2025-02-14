const TopbarButton = ({
  iconClass,
  onClick,
}: {
  iconClass: string;
  onClick?: () => void;
}) => {
  return (
    <button
      className='mr-2 rounded-xl p-2 duration-300 hover:bg-gray-700'
      onClick={onClick}
    >
      <i className={iconClass}></i>
    </button>
  );
};

export default TopbarButton;
