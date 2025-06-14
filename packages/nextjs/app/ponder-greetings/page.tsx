"use client";

//import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
//import type { NextPage } from "next";
import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";

/*
type Greeting = {
  id: string;
  text: string;
  setterId: `0x${string}`;
  premium: boolean;
  value: bigint;
  timestamp: number;
};
*/

type Job = {
  jobId: string;
  freelancer?: `0x${string}`;
  client?: `0x${string}`;
  payment?: string;
  title?: string;
  description?: string;
  estimatedDuration?: string;
  createdAt?: string;
  acceptedAt?: string;
  deadline?: string;
  completedAt?: string;
  cancelledAt?: string;
};

type Confirmation = {
  id: string;
  jobId: string;
  confirmer: `0x${string}`;
  isClient: boolean;
  timestamp: string;
};

//type GreetingsData = { greetings: { items: Greeting[] } };
type JobsData = { jobs: { items: Job[] } };
type ConfirmationsData = { confirmations: { items: Confirmation[] } };
/*
const fetchGreetings = async () => {
  const GreetingsQuery = gql`
    query Greetings {
      greetings(orderBy: "timestamp", orderDirection: "desc") {
        items {
          id
          text
          setterId
          premium
          value
          timestamp
        }
      }
    }
  `;
  const data = await request<GreetingsData>(
    process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069",
    GreetingsQuery,
  );
  return data;
};
*/
const fetchJobsAndConfirmations = async () => {
  const query = gql`
    query JobsAndConfirmations {
      jobs(orderBy: "createdAt", orderDirection: "desc") {
        items {
          jobId
          freelancer
          client
          payment
          title
          description
          estimatedDuration
          createdAt
          acceptedAt
          deadline
          completedAt
          cancelledAt
        }
      }
      confirmations(orderBy: "timestamp", orderDirection: "desc") {
        items {
          id
          jobId
          confirmer
          isClient
          timestamp
        }
      }
    }
  `;
  const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
  return request<{ jobs: JobsData["jobs"]; confirmations: ConfirmationsData["confirmations"] }>(endpoint, query);
};

/*
const PonderGreetings: NextPage = () => {
  const { data: greetingsData } = useQuery({
    queryKey: ["greetings"],
    queryFn: fetchGreetings,
  });

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 text-center">
          <h1 className="text-4xl font-bold">Ponder</h1>
          <div>
            <p>
              This extension allows using{" "}
              <a target="_blank" href="https://ponder.sh/" className="underline font-bold text-nowrap">
                Ponder
              </a>{" "}
              for event indexing on a SE-2 dapp.
            </p>
            <p>Ponder is an open-source framework for blockchain application backends.</p>
            <p>
              With Ponder, you can rapidly build & deploy an API that serves custom data from smart contracts on any EVM
              blockchain.
            </p>
          </div>

          <div className="divider my-0" />
          <h2 className="text-3xl font-bold mt-4">Getting Started</h2>
          <div>
            <p>
              Get started defining your data schema at{" "}
              <code className="italic bg-border text-base font-bold max-w-full break-words break-all [word-spacing:-0.5rem] inline-block">
                packages / ponder / ponder.schema.tsx
              </code>{" "}
              following the Ponder documentation at{" "}
              <a target="_blank" href="https://ponder.sh/docs/schema" className="underline font-bold text-nowrap">
                https://ponder.sh/docs/schema
              </a>
            </p>
            <p>
              Then index events by adding files to{" "}
              <code className="italic bg-border text-base font-bold max-w-full break-words break-all [word-spacing:-0.5rem] inline-block">
                packages / ponder / src /
              </code>{" "}
              (
              <a
                target="_blank"
                href="https://ponder.sh/docs/indexing/create-update-records"
                className="underline font-bold text-nowrap"
              >
                https://ponder.sh/docs/indexing/create-update-records
              </a>
              )
            </p>
            <p>
              Start the development Ponder server running{" "}
              <code className="italic bg-border text-base font-bold max-w-full break-words break-all [word-spacing:-0.5rem] inline-block">
                yarn ponder:dev
              </code>
            </p>
            <p>
              Finally, query your data using the Ponder GraphQL API (
              <a
                target="_blank"
                href="https://ponder.sh/docs/query/graphql"
                className="underline font-bold text-nowrap"
              >
                https://ponder.sh/docs/query/graphql
              </a>
              )
            </p>
            <p>
              You can find more information at{" "}
              <code className="italic bg-border text-base font-bold max-w-full break-words break-all [word-spacing:-0.5rem] inline-block">
                packages / ponder / README.md
              </code>{" "}
              or the{" "}
              <a target="_blank" href="https://ponder.sh" className="underline font-bold text-nowrap">
                Ponder website
              </a>
            </p>
          </div>
          <div className="divider my-0" />

          <h2 className="text-3xl font-bold mt-4">Greetings example</h2>

          <div>
            <p>Below you can see a list of greetings fetched from Ponder GraphQL API.</p>
            <p>
              Add a greeting from the{" "}
              <Link href="/debug" passHref className="link">
                Debug Contracts
              </Link>{" "}
              tab, reload this page and the new greeting will appear here.
            </p>
          </div>
        </div>

        <div className="flex-grow bg-border w-full mt-16 px-8 py-12">
          <h2 className="text-center text-4xl font-bold">Greetings</h2>
          {!greetingsData && (
            <div className="flex items-center flex-col flex-grow pt-12">
              <div className="loading loading-dots loading-md"></div>
            </div>
          )}
          {greetingsData && !greetingsData.greetings.items.length && (
            <div className="flex items-center flex-col flex-grow pt-4">
              <p className="text-center text-xl font-bold">No greetings found</p>
            </div>
          )}
          {greetingsData && greetingsData.greetings.items.length && (
            <div className="flex flex-col items-center">
              {greetingsData.greetings.items.map((greeting: Greeting) => (
                <div key={greeting.id} className="flex items-center space-x-2">
                  <p className="my-2 font-medium">{greeting.text}</p>
                  <p>from</p>
                  <Address address={greeting.setterId} />
                  <p>at</p>
                  <p className="my-2 font-medium">{new Date(greeting.timestamp * 1000).toLocaleString()}</p>
                  {greeting.premium && <p className="my-2 font-medium"> - Premium (Ξ{formatEther(greeting.value)})</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PonderGreetings;
*/
const PonderJobs = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["jobsAndConfirmations"],
    queryFn: fetchJobsAndConfirmations,
  });

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <h2 className="text-4xl font-bold">Jobs and Confirmations</h2>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center flex-col pt-12">
          <div className="loading loading-dots loading-md"></div>
        </div>
      )}

      {/* Jobs display */}
      {data?.jobs.items.length === 0 && <p>No jobs found.</p>}
      {data?.jobs.items && data.jobs.items.length > 0 && (
        <div className="mt-8 w-full max-w-3xl">
          <h3 className="text-2xl font-bold">Jobs</h3>
          {data.jobs.items.map(job => (
            <div key={job.jobId} className="my-4 p-4 border rounded-lg">
              <div>
                <strong>Job ID:</strong> {job.jobId ? job.jobId.toString() : "N/A"}
              </div>
              <div>
                <strong>Title:</strong> {job.title || "N/A"}
              </div>
              <div>
                <strong>Description:</strong> {job.description || "N/A"}
              </div>
              <div>
                <strong>Freelancer:</strong> {job.freelancer ? <Address address={job.freelancer} /> : "N/A"}
              </div>
              <div>
                <strong>Client:</strong> {job.client ? <Address address={job.client} /> : "N/A"}
              </div>
              <div>
                <strong>Payment:</strong> {job.payment ? `${formatEther(BigInt(job.payment))} ETH` : "N/A"}
              </div>
              <div>
                <strong>Created At:</strong>{" "}
                {job.createdAt ? new Date(Number(job.createdAt) * 1000).toLocaleString() : "N/A"}
              </div>
              <div>
                <strong>Accepted At:</strong>{" "}
                {job.acceptedAt ? new Date(Number(job.acceptedAt) * 1000).toLocaleString() : "N/A"}
              </div>
              <div>
                <strong>Deadline:</strong>{" "}
                {job.deadline ? new Date(Number(job.deadline) * 1000).toLocaleString() : "N/A"}
              </div>
              <div>
                <strong>Completed At:</strong>{" "}
                {job.completedAt ? new Date(Number(job.completedAt) * 1000).toLocaleString() : "N/A"}
              </div>
              <div>
                <strong>Cancelled At:</strong>{" "}
                {job.cancelledAt ? new Date(Number(job.cancelledAt) * 1000).toLocaleString() : "N/A"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmations display */}
      {data?.confirmations.items.length === 0 && <p>No confirmations found.</p>}
      {data?.confirmations.items && data.confirmations.items.length > 0 && (
        <div className="mt-8 w-full max-w-3xl">
          <h3 className="text-2xl font-bold">Confirmations</h3>
          {data.confirmations.items.map(conf => (
            <div key={conf.id} className="my-4 p-4 border rounded-lg">
              <div>
                <strong>Job ID:</strong> {conf.jobId}
              </div>
              <div>
                <strong>Confirmer:</strong> <Address address={conf.confirmer} />
              </div>
              <div>
                <strong>Is Client:</strong> {conf.isClient ? "Yes" : "No"}
              </div>
              <div>
                <strong>Timestamp:</strong> {new Date(Number(conf.timestamp) * 1000).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PonderJobs;
