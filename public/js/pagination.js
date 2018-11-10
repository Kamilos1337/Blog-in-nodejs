class Pagination{

constructor(totalCount,currentPage,pageUri,perPage=2){
    this.perPage = perPage;
    this.totalCount =parseInt(totalCount);
    this.currentPage = parseInt(currentPage);
    this.previousPage = this.currentPage - 1;
    this.nextPage = this.currentPage + 1;
    this.pageCount = Math.ceil(this.totalCount / this.perPage);
    this.pageUri = pageUri;
    this.offset  = this.currentPage > 1 ? this.previousPage * this.perPage : 0;
    this.sidePages = 4;
    this.pages = false;
}



links(){
    this.pages='<ul class="pagination pagination-md">';

    if(this.previousPage > 0)
        this.pages+='<li class="page-item"><a class="page-link" href="'+this.pageUri + this.previousPage+'">Previous</a></li>';


        /*Add back links*/
        if(this.currentPage > 1){
            for (var x = this.currentPage - this.sidePages; x < this.currentPage; x++) {
                if(x > 0)
                    this.pages+='<li class="page-item"><a class="page-link" href="'+this.pageUri+x+'">'+x+'</a></li>';
            }
        }

        /*Show current page*/
        this.pages+='<li class="page-item active"><a class="page-link" href="'+this.pageUri+this.currentPage+'">'+this.currentPage+'</a></li>';

        /*Add more links*/
        for(x = this.nextPage; x <= this.pageCount; x++){

            this.pages+='<li class="page-item"><a class="page-link" href="'+this.pageUri+x+'">'+x+' </a></li>';

            if(x >= this.currentPage + this.sidePages)
                break;
        }


        /*Display next buttton navigation*/
        if(this.currentPage + 1 <= this.pageCount)
            this.pages+='<li class="page-item"><a class="page-link" href="'+this.pageUri+this.nextPage+'">Next</a></li>';

        this.pages+='</ul>';

    return this.pages;
}
}
module.exports = Pagination;