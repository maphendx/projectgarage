const TopbarButton = ({
  iconClass,
  onClick,
  children,
}: {
  iconClass?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) => {
  return (
    <button
      className='mr-2 rounded-xl p-2 duration-300 hover:bg-gray-700'
      onClick={onClick}
    >
      {children || <i className={iconClass}></i>}
    </button>
  );
};

export default TopbarButton;
