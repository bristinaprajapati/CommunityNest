const express = require("express");
const Community = require("../models/Community");
const User = require("../models/User");
const authenticate = require("./authenticate"); // Assuming authenticate middleware is correctly set up

const router = express.Router();

router.post("/add-member", authenticate, async (req, res) => {
  const { communityId, memberEmail } = req.body;
  const userId = req.userId; // The admin's ID (the one adding the member)

  try {
      const community = await Community.findById(communityId);
      if (!community) return res.status(404).json({ message: "Community not found" });

      // Check if the logged-in user is the admin of the community
      if (String(community.admin) !== String(userId)) {
          return res.status(403).json({ message: "You do not have permission to add members to this community!" });
      }

      const userToAdd = await User.findOne({ email: memberEmail });
      if (!userToAdd) {
          return res.status(404).json({ message: "Email not registered" });
      }

      if (userToAdd.status !== "member") {
          return res.status(400).json({ message: "The user must be a member to be added." });
      }

      // Add the communityId and adminId to the member's `communityDetails` field
      const updatedUser = await User.findOneAndUpdate(
          { email: memberEmail },
          { 
            $addToSet: {
              communities: community._id, // Add the community ID to the `communities` field
              communityDetails: {
                communityId: community._id, 
                adminId: community.admin // Store the admin's userId
              }
            }
          },
          { new: true }
      );

      console.log("After Adding:", updatedUser.communities);

      if (!community.members.includes(userToAdd._id)) {
          community.members.push(userToAdd._id);
          await community.save();
      }

      res.json({ message: "Member added successfully", updatedUser });
  } catch (error) {
      console.error("Error Adding Member:", error);
      res.status(500).json({ message: "Internal server error", error });
  }
});

router.get("/getCommunityDetails/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user with community details
    const user = await User.findById(userId).select("communityDetails");

    if (!user || !user.communityDetails || user.communityDetails.length === 0) {
      return res.status(404).json({ success: false, message: "Community details not found" });
    }

    res.status(200).json({ success: true, communityDetails: user.communityDetails });
  } catch (error) {
    console.error("Error fetching community details:", error);
    res.status(500).json({ success: false, message: "Error fetching community details" });
  }
});


router.delete("/:communityId/remove-member/:memberId", authenticate, async (req, res) => {
  const { communityId, memberId } = req.params;
  const userId = req.userId; // Extract user ID from token

  try {
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ message: "Community not found" });

    if (String(community.admin) !== String(userId)) {
      return res.status(403).json({ message: "You do not have permission to remove members from this community!" });
    }

    // Check if the member exists
    const memberIndex = community.members.indexOf(memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found in the community" });
    }

    // Remove the member and save the changes
    community.members.splice(memberIndex, 1);
    await community.save();

    // Send a response after successful deletion
    res.json({ message: "Member removed successfully", removedMemberId: memberId });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
});

  
// // Get all members of a community (for both community managers and normal members)
// router.get("/:communityId/members", authenticate, async (req, res) => {
//   const userId = req.userId; // Use req.userId consistently
//   const { communityId } = req.params;
  
//   try {
//     // Find the community
//     const community = await Community.findById(communityId).populate("members", "username email");

//     if (!community) {
//       return res.status(404).json({ message: "Community not found!" });
//     }

//     const currentUser = await User.findById(userId);

//     // Check if the user is part of the community
//     if (currentUser.status === "member" && !currentUser.communities.includes(communityId)) {
//       return res.status(403).json({ message: "You are not a member of this community!" });
//     }

//     res.status(200).json({ members: community.members });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// Get all members of a community (for both community managers and normal members)
router.get("/:communityId/members", authenticate, async (req, res) => {
  const userId = req.userId;
  const { communityId } = req.params;
  
  try {
    // Update this line to include profileImage in the populated fields
    const community = await Community.findById(communityId).populate("members", "username email profileImage");

    if (!community) {
      return res.status(404).json({ message: "Community not found!" });
    }

    const currentUser = await User.findById(userId);

    // Check if the user is part of the community
    if (currentUser.status === "member" && !currentUser.communities.includes(communityId)) {
      return res.status(403).json({ message: "You are not a member of this community!" });
    }

    res.status(200).json({ members: community.members });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
