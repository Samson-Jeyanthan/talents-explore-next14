const TalentRegisterStatusBar = ({ data, page }: any) => {
  return (
    <aside className="sticky flex h-[80vh] w-[22rem] flex-col gap-4 border-r border-solid border-dark-300">
      {data.map((item: any, index: number) => (
        <div key={item._id}>
          <div
            className={`
              ${item.complete === true ? "" : ""}
              ${index === page ? "text-light-850" : "text-dark-400"}
              `}
          >
            <h2>{item.title}</h2>
            <p>{item.subTitle}</p>
          </div>
          <div>{item.icon}</div>
        </div>
      ))}
    </aside>
  );
};

export default TalentRegisterStatusBar;
