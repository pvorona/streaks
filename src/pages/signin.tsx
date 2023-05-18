import Link from "next/link";
import { useRouter } from "next/router";
import { useId, useState } from "react";
import { withSessionSsr } from "~/server/session";
import { useForm } from "react-hook-form";
import classNames from "classnames";
import { getBaseUrl } from "~/utils/api";

export const getServerSideProps = withSessionSsr(function getServerSideProps({
  req,
}) {
  const {
    session: { user },
  } = req;

  if (user) {
    return {
      redirect: {
        permanent: false,
        destination: getBaseUrl(),
      },
      props: {},
    };
  }

  return {
    props: {},
  };
});

export default function SignIn() {
  return (
    <div className="flex h-full items-center justify-center">
      <SignInForm />
    </div>
  );
}

type FormValues = { email: string; password: string };

function SignInForm() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const { register, handleSubmit, formState, setError } = useForm<FormValues>();
  const [isLoading, setIsLoading] = useState(false);

  async function signIn(data: FormValues) {
    if (isLoading) return
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/signIn", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await router.push("/");
      } else {
        setError("root", {});
      }
    } catch (error) {
      setError("root", {});
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="mx-4 w-96 max-w-full" onSubmit={handleSubmit(signIn)}>
      <div className="mb-5 text-center  text-3xl font-bold">Sign in</div>

      <div className="form-control w-full">
        <label className="label" htmlFor={emailId}>
          <span
            className={classNames(
              "label-text",
              formState.errors.root && "text-error"
            )}
          >
            Email
          </span>
        </label>
        <input
          {...register("email", { required: true })}
          id={emailId}
          type="text"
          placeholder="example@mail.com"
          autoComplete="email"
          className={classNames(
            "input-bordered input-primary input w-full",
            formState.errors.root && "input-error"
          )}
          autoFocus
        />
        <label htmlFor={emailId} className="label">
          <span
            className={classNames(
              "label-text-alt",
              formState.errors.root && "text-error"
            )}
          >
            {formState.errors.root ? "Invalid credentials" : "Your email"}
          </span>
        </label>
      </div>

      <div className="form-control w-full">
        <label className="label" htmlFor={passwordId}>
          <span
            className={classNames(
              "label-text",
              formState.errors.root && "text-error"
            )}
          >
            Password
          </span>
        </label>
        <input
          {...register("password", { required: true, minLength: 6 })}
          id={passwordId}
          type="password"
          autoComplete="current-password"
          placeholder="Mb8>Amq!"
          className={classNames(
            "input-bordered input-primary input w-full",
            formState.errors.root && "input-error"
          )}
        />
        <label htmlFor={passwordId} className="label">
          <span
            className={classNames(
              "label-text-alt",
              formState.errors.root && "text-error"
            )}
          >
            {formState.errors.root ? "Invalid credentials" : "Your password"}
          </span>
        </label>
      </div>

      <button
        disabled={!formState.isValid}
        className={classNames(
          "btn-primary btn-lg btn mt-3 w-full",
          isLoading && "loading"
        )}
      >
        {isLoading ? "Loading..." : "Sign in"}
      </button>

      <div className="mt-8 text-center ">
        Don&apos;t have an account yet?
        <Link href="/signup" className="link ml-1">
          Sign up
        </Link>
      </div>
    </form>
  );
}
