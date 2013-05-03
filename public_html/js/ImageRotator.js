/* Scope and self initiation */

//event architecture
(function(glob){
    var Event = function(scope){
        this.scope = scope;
    };

    //blue prints
    Event.prototype = {
        listeners: [],

        addEventListener: function(eventType, callback){
            //check if eventType and callback is defined
            //or fail silently.
            if(!eventType || !callback){
                return;
            }
            //if eventType is not added to the listeners
            //hash table. Add It.
            if(!this.listeners[eventType]){
                this.listeners[eventType] = {
                    eventType: eventType,
                    callback: callback
                }
            }
        },

        removeEventListener: function(eventType){
            //if eventType is not defined, there is
            //nothing to do
            if(!eventType){
                return;
            }
            //now check whether any event exists as eventType
            //in the listeners hashTable and then delete
            if(this.listeners[eventType]){
                this.listeners[eventType] = null;
            }
        },

        dispatchEvent: function(eventType){
            //get the obj from the listeners hashTable
            var evtObj = this.listeners[eventType],
                callback = evtObj && evtObj.callback;

            if(callback){
                callback.call(this.scope);
            }
        }
    };

    //expose to the global scope
    glob.Event = Event;

}(this));

(function(window, $){

    /*
     * @param   data    The object which contains the data as XML
     *                  or the url for the XML.
     */
    var ImageRotator = function(data){
        //list of slides
        this.slides = [];
        //need to load or parse the data.
        this.dataObj = data;
        //start data fectching or parsing
        this.dataObj && this.getData();
        //subscribe to the event object
        this.event = new Event(this);
    };

    //default options
    ImageRotator.defaults = {

    };

    ImageRotator.prototype = {

        /*
         * method to parse XML
         */

        parseXML: function(xmlData){
            var xmlDoc,
                slides = this.slides || [];
            //check whether the passed data is in XML format
            //remove white spaces (trim)
            if(xmlData.childNodes){
                //direct assignments
                //@todo: how to remove whitespace in already an
                //XML document.
                xmlDoc = xmlData;
            }
            //else convert to XML
            else{
                xmlDoc = $.parseXML($.trim(xmlData));
            }
            //iterate over the slides and store data
            $(xmlDoc).find("slide").each(function(){
                var slide = {},
                    childNodes = this.childNodes,
                    numSlides = childNodes && childNodes.length,
                    i,
                    node,
                    nodeName;

                for(i = 0; i < numSlides; i += 1){
                    node = childNodes[i];
                    nodeName = node && node.nodeName.toLowerCase();

                    if(nodeName === 'image' || nodeName === 'heading'
                                        || nodeName === 'description'){
                        slide[nodeName] = $(node).text();
                    }
                }
                slides.push(slide);
            });
            //update class level sildes object
            this.slides = slides;
            //fire XML parse complete event
            this.event.dispatchEvent('xml-parsed');
        },

        /*
         * function to load the data.
         */
        getData: function(){
            var dataObj = this.dataObj,
                dataXML = dataObj && dataObj.dataXML,
                dataURL = dataObj && dataObj.dataURL,
                scope = this;
            //check if dataObj is defined or return
            if(!dataObj){
                return;
            }
            //now depending on the data type either loads the data
            //or parse it.
            if(dataXML && dataXML.length > 0){
                //parse the XML
                this.parseXML(dataXML);
            }else if(dataURL){
                //load the XML
                $.ajax({
                   scope: scope, // parent scope need to be passed.
                   url: dataURL,
                   success: function(args){
                       this.scope.parseXML(args);
                   },
                   error: function(e){
                       //@todo: need to define a proper error report
                       //mechanism.
                       console.log(e.responseText);
                   }
                });
            }
        }



    };

    //expose to the global scope
    window.ImageRotator = ImageRotator;

})(window, jQuery);


