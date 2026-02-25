import clsx from "clsx";

export default function Button({
  children,
  className,
  variant = "primary",
  loading = false,
  ...props
}) {
  const styles =
    variant === "ghost" ? "btn-ghost" : "btn-primary";

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={clsx(styles, "disabled:opacity-60 disabled:cursor-not-allowed", className)}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
