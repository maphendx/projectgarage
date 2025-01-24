import { useState, useEffect } from 'react';

/*

    Цей чел працює вельми містично

*/

export const InfoBlock = ({
  getClasses,
  getIconClasses,
  getMessage,
  isAlive,
}: {
  getClasses: string;
  getIconClasses?: string;
  getMessage: string;
  isAlive: boolean;
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [suicide, doSuicide] = useState<boolean>(false);

  useEffect(() => {
    if (!isAlive) {
      setVisible(false);
      doSuicide(true);
    }
  }, [isAlive]);

  useEffect(() => {
    if (isAlive) {
      const timeout = setTimeout(() => setVisible(true), 10); // for appearance
      setTimeout(() => {
        // for disappearance and subsequent self-destruction
        setVisible(false);
        setTimeout(() => {
          doSuicide(true);
        }, 1001);
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [isAlive]);

  return suicide ? null : (
    <div
      className={`${getClasses} fixed z-20 flex flex-row items-center p-3 text-white ${
        visible ? '-translate-y-5' : 'translate-y-96'
      } bottom-0 left-1/2 -translate-x-1/2 rounded-xl transition-all duration-1000 ease-in`}
    >
      {getIconClasses && (
        <i className={`${getIconClasses} fa-lg mr-3`} aria-hidden='true'></i>
      )}
      <p>{getMessage}</p>
    </div>
  );
};
