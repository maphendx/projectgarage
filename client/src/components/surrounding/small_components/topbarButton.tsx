const TopbarButton = ({ iconClass }: { iconClass: string }) => {
  return (
    <button className='mr-2 rounded-xl p-2 duration-300 hover:bg-gray-700'>
      <i className={iconClass}></i>
    </button>
  );
};

export default TopbarButton;
