import useUserStore from "@/ZustandStore/UserStore"
import { useState } from "react"

const ProfilePage = () => {
  const { currentUser } = useUserStore()
  return (
    <>
      <h1 className="text-center text-2xl">weleome to the profile page</h1>
    </>
  )

}


export default ProfilePage
