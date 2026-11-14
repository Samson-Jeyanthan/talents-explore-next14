const TalentRegisterStatusBar = ({ data, page }: any) => {
  return (
    <aside className="sticky flex h-[80vh] w-[22rem] flex-col gap-4 border-r border-solid border-dark-300">
      {data.map((item: any, index: number) => (
        <div
          key={index}
          className="mt-4 flex w-[90%] items-center justify-between gap-4"
        >
          <div
            className={`
              ${item.complete === true ? "" : ""}
              ${index === page ? "text-light-850" : "text-light-500"}
              `}
          >
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-sm text-light-500">{item.subTitle}</p>
          </div>
          <div
            className={`${index === page ? "border-light-850 fill-light-850 text-light-850" : "border-light-500 fill-light-500 text-light-500"} flex-center size-10 rounded-full border `}
          >
            {item.icon}
          </div>
        </div>
      ))}
    </aside>
  );
};

export default TalentRegisterStatusBar;
