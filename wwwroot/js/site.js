ko.bindingHandlers['modal'] = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var allBindings = allBindingsAccessor();
      var $element = $(element);
      $element.addClass('hide modal');
      
      if (allBindings.modalOptions && allBindings.modalOptions.beforeClose) {
        $element.on('hide', function() {
          var value = ko.utils.unwrapObservable(valueAccessor());
          return allBindings.modalOptions.beforeClose(value);
        });
      }
    },
    update: function(element, valueAccessor) {
      var value = ko.utils.unwrapObservable(valueAccessor());
      if (value) {
        $(element).removeClass('hide').modal('show');
      } else {
        $(element).modal('hide');
      }
    }
  };

Number.prototype.formatMoney = function(c, d, t){
    var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))), 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

new function() {
// Write your Javascript code.

function Prize(value) {
    var self = this;
    self.value = value;
    self.money = ko.computed(function(){
        return "$" + Number(self.value).formatMoney(0);
    });
    self.picked = ko.observable(false);
}

function Case(number, prize) {
    var self = this;
    self.number = number;
    self.prize = ko.observable(prize);
    self.opened = ko.observable(false);
    self.personalCase = ko.observable(false);
}

// Overall viewmodel for this screen, along with initial state
function DealOrNoDealGame() {
    var self = this;

    // Non-editable catalog data - would come from the server
    // Editable data
    self.cases = ko.observableArray([]);
    self.prizes = ko.observableArray([]);
    self.winningAmount = ko.observable(null);
    // self.winninAmountMoney = ko.computed(function() {
    //     return "$" + Number(self.winningAmount()).formatMoney(2);
    // });
    
    
    self.personalCase = ko.computed(function() {
        if(self.cases() == null)
            return null;
        return self.cases().find(function(e) {
            return e.personalCase() == true;
        });
    });

    self.turnsToOffer = ko.observable(3);

    self.casesRemaining = ko.computed(function() {
        return self.cases().filter(c => c.prize().picked() == false && c.personalCase() == false).length;
    });

    self.bankersOffer = ko.computed(function() {
        if(self.cases() == null || self.winningAmount() != null)
            return null;
        
        if(self.turnsToOffer() == 0)
        {
            var offerValue = 0;
            var totalValue = 0;
            var activeCases = self.cases().filter(c => c.prize().picked() == false && c.personalCase() == false);
            var activeValues = activeCases.map(c => c.prize().value);
            if(activeValues.length > 0)
                totalValue = activeValues.reduce((c,t) => Number(c)+Number(t));
            
            //offerValue = totalValue / activeCases.length+1;


            activeValues.sort( function(a,b) {return a - b;} );
        
            var half = Math.floor(activeValues.length/2);
        
            if(activeValues.length % 2)
                offerValue = activeValues[half];
            else
                offerValue = (activeValues[half-1] + activeValues[half]) / 2.0;

            
            return "$" + Number(offerValue).formatMoney(2);
        }
        return null;
    });

    // Game Actions
    self.caseClicked = function(clickedCase) {
        if(self.cases() == null || self.bankersOffer())
            return null;
        
        if(self.personalCase() == null)
        {
            clickedCase.personalCase(true);
        }
        else if(clickedCase.personalCase() == false && clickedCase.prize().picked() == false)
        {
            if(self.casesRemaining() == 1)
                self.winningAmount("$"+ Number(self.personalCase().prize().value).formatMoney(2))
            clickedCase.prize().picked(true);
            self.turnsToOffer(self.turnsToOffer()-1);
        }
    }

    self.makeDeal = function(clickedButton) {
        self.winningAmount(self.bankersOffer());
    }

    self.noDeal = function(clickedButton) {
        if(self.casesRemaining() > 5)
            self.turnsToOffer(3);
        else if(self.casesRemaining() > 2)
            self.turnsToOffer(2);
        else
            self.turnsToOffer(1);
    }
    
    self.emptyCases = function() {
        while(self.cases().length > 0)
            self.cases().pop();

        while(self.prizes().length > 0)
            self.prizes().pop();
    }

    self.createCases = function() {
        self.emptyCases();

        var init = [1,5,10,25,50,75,100,200,300,400,500,750,1000,5000,10000];
        self.prizes(init.map(i => new Prize(i)))

        for(var caseNumber = 1; caseNumber < 16; caseNumber++)         
        {
            var r = getRandomInt(50);
            while(r-- > 0){
                init.push(init.shift());
            }
            self.cases.push(new Case(caseNumber, self.prizes().find(x => x.value == init[0])));
            init.shift();
        }
    }
    
    self.resetGame = function() {
        self.winningAmount(null);
        self.turnsToOffer(3);
        self.cases().every(function(c, i){
            c.personalCase(false);
        });
        self.createCases();
    }
    // 

    self.createCases();
}

ko.applyBindings(new DealOrNoDealGame());
}();