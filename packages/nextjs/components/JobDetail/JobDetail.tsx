import { fetchJob } from "@services/graphql/fetchers/job";
import { useQuery } from "@tanstack/react-query";
import { Job } from "~~/types/job/job.types";

export default function JobDetail({ postingId, jobId }: { postingId: string; jobId: string }) {
  //const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Job>({
    queryKey: ["jobDetail", jobId],
    queryFn: () => fetchJob(postingId, jobId),
  });

  //const reload = async () => {
  //  queryClient.invalidateQueries({ queryKey: ["jobDetail", postingId, jobId] });
  //  await new Promise(resolve => setTimeout(resolve, 1000));
  //  await refetch();
  //};

  return (
    <div className="flex flex-col min-h-screen mt-4">
      <h1 className="text-2xl font-bold mb-4">Job Details</h1>
      {/* Job details component will be implemented here */}
      <p>
        Details for job ID: {jobId} and posting ID: {postingId}
      </p>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <h2 className="text-xl font-semibold">{data?.title}</h2>
          <p>{data?.description}</p>
          <p>Payment: {data?.payment}</p>
          <p>Category: {data?.category}</p>
          <p>State: {data?.state}</p>
          {/* Add more job details as needed */}
        </div>
      )}
    </div>
  );
}
