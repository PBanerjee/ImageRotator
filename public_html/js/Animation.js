(function(win, $){
    var AnimationManager = function(scope){
        this.scope = scope;
        //store all animations
        this.animations = [];
    };

    AnimationManager.prototype = {
        defaults: {
            types: ['fadeIn', 'fadeOut', 'slideIn',
                'slideOut', 'slideDown', 'slideUp'],
            inProgress: 0,
            completed: 0,
            stayDuration: 1000
        },

        isAnimating: function(){
            var inProgress = this.defaults.inProgress;

            return inProgress > 0 ? true : false;
        },

        setAnimations: function(animations){
            this.animations = animations;
        },

        /*
         * method to animate a slide.
         * Slide can be of multiple elements.
         *
         * @param object slide  One Slide object
         * @returns {undefined}
         */
        animateSlide: function(slide){
            var elementObj,
                domElem,
                showAnimId,
                hideAnimId,
                showAnimObj,
                hideAnimObj,
                elem;

            if(slide instanceof Object){
                for(elem in slide){
                    elementObj = slide[elem];
                    if(elementObj instanceof Object){
                        showAnimId = elementObj.showAnimId || slide.showAnimId;
                        hideAnimId = elementObj.hideAnimId || slide.hideAnimId;
                        showAnimObj = this.animations[showAnimId];
                        hideAnimObj = this.animations[hideAnimId];
                        domElem = elementObj.element;
                        this.animate(domElem, showAnimObj, hideAnimObj);
                    }
                }
            }
            else{
                //at present nothing all slides
                //are object
            }
        },

        /*
         * Method to initiate animation on a single
         * or multiple elements.
         *
         * @todo: Ignoring the possiblity of param
         *        elem to be an array.
         */
        animate: function(elem, shAObj, hdAObj){
            var animMngr = this,
                elemObj = elem,
                active = elemObj.active,//$(elem).attr('display'),
                animObj = active ? hdAObj : shAObj,
                delay = animObj && parseInt(animObj.delay) || 0;

            //in case hide animObj is non-synchornuous
            //we need to start the show anim after the completion
            //of the hide anim
            if(animObj === shAObj && hdAObj.continue === 'true'
                        && delay === 0){
                delay += parseInt(hdAObj.duration);
            }
            //execute the function after the delay.
            //in case no delay defined this should exceute
            //immediately.
            setTimeout(function(){
                $(elemObj)[animObj.type].call(elemObj,
                        {
                            duration: parseInt(animObj.duration),
                            complete: function(){
                                elemObj.active = !elemObj.active;
                                animMngr.onComplete.call(animMngr);
                            }
                        });
            }, delay);

            //increase counter
            this.defaults.inProgress += 1;
        },

        onComplete: function(){
            //increase complete counter
            this.defaults.completed += 1;
            if(this.defaults.inProgress === this.defaults.completed){
                //reset counters
                this.defaults.completed = this.defaults.inProgress = 0;
                this.callback.call(this.scope);
            }
        },

        start: function(crntSlideObj, nxtSlideObj, callback){
            //do not start animation if anything is ongoing
            if(this.defaults.inProgress === 0){
                crntSlideObj && this.animateSlide(crntSlideObj);
                nxtSlideObj && this.animateSlide(nxtSlideObj);
            }
            //to revert when all animations has completed
            this.callback = callback;
        },

        stop: function(){

        }
    };

    AnimationManager.prototype.constructor = AnimationManager;

    win.AnimationManager = AnimationManager;

})(window, jQuery);


