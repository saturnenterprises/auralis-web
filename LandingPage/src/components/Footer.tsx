const Footer = () => {
  return (
    <footer
      className="bg-transparent overflow-hidden relative flex items-center justify-center pt-14 pb-4"
      style={{
        zIndex: 0,
        marginTop: "-2rem", // keeps slight overlap with content above
      }}
    >
      <div className="w-full px-4 text-center">
        <h2
          className="font-black tracking-tight leading-none transform scale-x-125 scale-y-125 w-full opacity-20"
          style={{
            fontSize: "clamp(2rem, 8vw, 8rem)",
            fontFamily: "Montserrat, sans-serif",
            WebkitTextStroke: "1px black",
            color: "white",
            margin: 0,
          }}
        >
          AURALISAI
          <span
            style={{
              WebkitTextStroke: "2px black",
              color: "#2563eb",
            }}
          ></span>
        </h2>
      </div>
    </footer>
  );
};

export default Footer;
