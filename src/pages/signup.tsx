import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { withSessionSsr } from "~/server/session";
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

export default function SignUp() {
  return (
    <div className="flex h-full items-center justify-center">
      <SignUpForm />
    </div>
  );
}

type FormValues = { email: string; password: string; allowTracking: boolean };

function SignUpForm() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState, setError } = useForm<FormValues>({
    defaultValues: {
      allowTracking: true,
    },
  });

  async function signIn({ email, password, allowTracking }: FormValues) {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/signUp", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          allowTracking,
        }),
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
      <div className="mb-5 text-center text-3xl font-bold">Sign up</div>

      <div className="form-control">
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
            Your email
          </span>
        </label>
      </div>

      <div className="form-control">
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
            At least 6 characters long
          </span>
        </label>
      </div>

      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text">Allow tracking</span>
          <input
            type="checkbox"
            className="toggle-success toggle"
            {...register("allowTracking")}
          />
        </label>
      </div>

      <button
        disabled={!formState.isValid}
        className={classNames(
          "btn-primary btn-lg btn mt-3 w-full",
          isLoading && "loading"
        )}
      >
        {isLoading ? "Loading..." : "Sign up"}
      </button>

      <div className="mt-8 text-center">
        Already have an account?
        <Link href="/signin" className="link ml-1">
          Sign in
        </Link>
      </div>
    </form>
  );
}
