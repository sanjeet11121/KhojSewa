import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: Number,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    refreshToken: {
        type: String
    }
}, { timestamps: true });




//password encrypt and decrypt 
userSchema.pre("save", async function(next) { //why not callback ?, because yaha context chainxa ra call back ma this ko reference,context hunna
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10) // 10 vaneko rounds ho 
    next()


})


//userSchema.models le custom method haru banauna milxa
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function() {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = async function() {
    return jwt.sign({
        _id: this._id,

    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}




export const User = mongoose.model('User', userSchema);