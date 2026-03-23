import type { NextPageContext } from "next";

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{statusCode ?? "Error"}</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          {statusCode ? `An error ${statusCode} occurred` : "An error occurred on the server"}
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
