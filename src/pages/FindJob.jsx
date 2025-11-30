import JobList from "./JobListing"

function FindJob({ account }) {
  return (
    <div className="pt-[100px] max-w-[1250px] m-auto">
      <JobList account={account}/>
    </div>
  )
}

export default FindJob
