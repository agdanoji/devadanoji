const express=require('express');
const router=express.Router();
const mongoose = require('mongoose');
const passport=require('passport');

// post model
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

//post validateion
const validatePostInput= require('../../validation/post');
//@route    GET api/posts/test
//@desc     Tests posts route
//@access   Public
router.get('/test',(req,res)=> res.json({msg:"Posts Works"}));
//@route    GET   api/posts
//@desc     Get all posts
//@access   Public
router.get('/',(req,res)=>{
  Post.find()
  .sort({date:-1})
  .then(posts=>res.json(posts))
  .catch(err=>res.status(404).json({nopostfound:'No posts found '}));
})

//@route    GET   api/posts/:id
//@desc     Get posts by id
//@access   Public
router.get('/:id',(req,res)=>{
  Post.findById(req.params.id)
  .then(post=>res.json(post))
  .catch(err=>res.status(404).json({nopostfound:'No post found with that id'}));
})

//@route    POST   api/posts
//@desc     Create posts
//@access   Private
router.post('/',passport.authenticate('jwt',{session:false}),(req,res)=>{

  const {errors,isValid}=validatePostInput(req.body);
  //Check validation
  if(!isValid){
    //if error ,send 400 with the error object
    return res.status(400).json(errors);
  }
  const newPost=new Post({
    text:req.body.text,
    name:req.body.name,
    avatar:req.body.avatar,
    user:req.user.id
  });
  newPost.save().then(post=>res.json(post));
});
//@route    DELETE   api/posts/:ID
//@desc     Create posts
//@access   Private
router.delete('/:id',passport.authenticate('jwt',{session:false}),(req,res)=>{
  Profile.findOne({user:req.user.id})
  .then(profile=>{
    Post.findById(req.params.id)
    .then(post=>{
      if(post.user.toString()!==req.user.id){
        return res.status(401).json({notauthorized:'User not authorized'});
      }
      //DELETE
      post.remove().then(()=>res.json({success:true}));
    })
    .catch(err=>res.status(404).json({postnotfound:'No post found'}));
  });
});

//@route    POST   api/posts/like/:ID
//@desc     Like posts
//@access   Private
router.post('/like/:id',passport.authenticate('jwt',{session:false}),(req,res)=>{
  Profile.findOne({user:req.user.id})
  .then(profile=>{
    Post.findById(req.params.id)
    .then(post=>{
      if(post.likes.filter(like=>like.user.toString()===req.user.id).length>0){
        return res.status(400).json({alreadyliked:'User already liked the post'})
      }

      // Add user id to likes array
      post.likes.unshift({user:req.user.id});
      post.save().then(post=> res.json(post));
    })
    .catch(err=>res.status(404).json({postnotfound:'No post found'}));
  })
})


//@route    POST   api/posts/unlike/:ID
//@desc     unLike posts
//@access   Private
router.post('/unlike/:id',passport.authenticate('jwt',{session:false}),(req,res)=>{
  Profile.findOne({user:req.user.id})
  .then(profile=>{
    Post.findById(req.params.id)
    .then(post=>{
      if(post.likes.filter(like=>like.user.toString()===req.user.id).length ===0){
        return res.status(400).json({notliked:'You have not yet liked the post'})
      }

      // get the remove index
      const removeIndex = post.likes
      .map(item=>item.user.toString())
      .indexOf(req.user.id);

      // splice out the array
      post.likes.splice(removeIndex,1);

      //Save
      post.save().then(post=> res.json(post));
    })
    .catch(err=>res.status(404).json({postnotfound:'No post found'}));
  });
});


//@route    POST   api/posts/comment/:ID
//@desc     Add comment on  posts
//@access   Private
router.post('/comment/:id',passport.authenticate('jwt',{session:false}),(req,res)=>{
  const {errors,isValid}=validatePostInput(req.body);
  //Check validation
  if(!isValid){
    //if error ,send 400 with the error object
    return res.status(400).json(errors);
  }
    Post.findById(req.params.id)
    .then(post=>{
      const newComment ={
        text:req.body.text,
        name:req.body.name,
        avatar:req.body.avatar,
        user:req.user.id
      }
      //Add to the comment array
      post.comments.unshift(newComment);


      //Save
      post.save().then(post=> res.json(post));
    })

    .catch(err=>res.status(404).json({postnotfound:'No post found'}));
});


//@route    DELETE   api/posts/comment/:ID/:comment_id
//@desc     remove comment on  posts
//@access   Private
router.delete('/comment/:id/:comment_id',passport.authenticate('jwt',{session:false}),(req,res)=>{
    Post.findById(req.params.id)
    .then(post=>{
      //check if the comment Exists
      if(post.comments.filter(
        comment=>comment._id.toString()=== req.params.comment_id).length ===0){
        return res.status(404).json({commentnotexists:'Comment does not exists'});
      }

      //get remove index
      const removeIndex=post.comments
      .map(item=> item._id.toString())
      .indexOf(req.params.comment_id);

      //splice the comment out of array
      post.comments.splice(removeIndex,1);

      //Save
      post.save().then(post=> res.json(post));
    })

    .catch(err=>res.status(404).json({postnotfound:'No post found'}));
});
module.exports=router;
