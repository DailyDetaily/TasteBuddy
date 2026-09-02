<html>
<head>
<meta http-dquiv="Content-Type" content="text/html" charset="utf-8">
<title>향토음식</title>
<script type='text/javascript'>
//검색
function fncSearch(){
	with(document.searchApiForm){
		pageNo.value = "1";
		method="get";
		action = "fdNmLst.php";
		target = "_self";
		submit();
	}
}

function fncTabChg(type){
		pageNo.value = "1";
		if(type == 'A'){
			schType.value = type;
			schTrditfdNm2.value="";
			sidoCode.value="";
			food_type_ctg01.value="";
			food_type_ctg02.value="";
			food_type_ctg03.value="";
			food_type_ctg04.value="";
			fd_mt_ctg01.value="";
			fd_mt_ctg02.value="";
			ck_ry_ctg01.value="";
			ck_ry_ctg02.value="";
			ck_ry_ctg03.value="";
			tema_ctg01.value="";
		}else if(type == 'B'){
			schType.value = type;
			schText.value="";
			schTrditfdNm.value="";
		}else if(type == 'food_type_ctg01'){
			 food_type_ctg02.value="";
			 food_type_ctg03.value="";
			 food_type_ctg04.value="";
		}
		else if(type == 'food_type_ctg02'){
			food_type_ctg03.value="";
			food_type_ctg04.value="";
		}
		else if(type == 'food_type_ctg03'){
				food_type_ctg04.value="";
		}
		else if(type == 'fd_mt_ctg01'){
			fd_mt_ctg02.value="";
		}
		else if(type == 'ck_ry_ctg01'){
			ck_ry_ctg02.value="";
			ck_ry_ctg03.value="";
		}
		else if(type == 'ck_ry_ctg02'){
			ck_ry_ctg03.value="";
		}
		method="get";
		action = "fdNmLst.php";
		target = "_self";
		submit();
	}
}
function fncContSearch(val){
	with(document.searchApiForm){
		pageNo.value = "1";
		schText.value = val;
		method="get";
		action = "fdNmLst.php";
		target = "_self";
		submit();
	}
}

//페이지 이동
function fncGoPage(page){
	with(document.searchApiForm){
		pageNo.value = page;
		method="get";
		action = "fdNmLst.php";
		target = "_self";
		submit();
	}
}

//상세
function fncView(dNo){
	with(document.searchApiForm){
		cntntsNo.value = dNo;
		method="get";
		action = "fdNmDtl.php";
		target = "_self";
		submit();
	}
}

//팝업 띄우기
function fncListOpen(type,dNo,nm){
	var popupUrl="fdNmPoP.php?type="+type+"&dNo="+dNo+"&nm="+nm;
	var popOption="width=800,height=440";
	window.open(popupUrl,"nongsaroPop",popOption);
}
</script>
</head>
<body>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>
<h3><strong>향토음식</strong></h3>
<hr>

<?PHP
	//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
	$apiKey = "발급받은인증키를삽입하세요";
	//서비스 명
	$serviceName = "nvpcFdCkry";
	//오퍼레이션 명
	$operationName = "fdNmLst";

	//XML 받을 URL 생성
	$parameter = "/".$serviceName."/".$operationName;
	$parameter .= "?apiKey=".$apiKey;

	//페이지 이동
	if(isset($_REQUEST["pageNo"])){
		$parameter .= "&pageNo=";
		$parameter .= $_REQUEST["pageNo"];
	}

	$schType ="A";
	$schText ="";
	//검색조건
	if(isset($_REQUEST["schType"])){
		$parameter .= "&schType=";
		$parameter .= $_REQUEST["schType"];
		$schType = $_REQUEST["schType"];
	}
	//검색어
	if(isset($_REQUEST["schText"])){
		$parameter .= "&schText=";
		$parameter .= $_REQUEST["schText"];
		$schText = $_REQUEST["schText"];
	}

	//검색어
	if(isset($_REQUEST["schTrditfdNm"])){
		$parameter .= "&schTrditfdNm=";
		$parameter .= $_REQUEST["schTrditfdNm"];
	}
	//검색어
	if(isset($_REQUEST["schTrditfdNm2"])){
		$parameter .= "&schTrditfdNm2=";
		$parameter .= $_REQUEST["schTrditfdNm2"];
	}
	//검색어
	if(isset($_REQUEST["sidoCode"])){
		$parameter .= "&sidoCode=";
		$parameter .= $_REQUEST["sidoCode"];
	}
	//검색어
	if(isset($_REQUEST["food_type_ctg01"])){
		$parameter .= "&food_type_ctg01=";
		$parameter .= $_REQUEST["food_type_ctg01"];
	}
	//검색어
	if(isset($_REQUEST["food_type_ctg02"])){
		$parameter .= "&food_type_ctg02=";
		$parameter .= $_REQUEST["food_type_ctg02"];
	}
	//검색어
	if(isset($_REQUEST["food_type_ctg03"])){
		$parameter .= "&food_type_ctg03=";
		$parameter .= $_REQUEST["food_type_ctg03"];
	}
	//검색어
	if(isset($_REQUEST["food_type_ctg04"])){
		$parameter .= "&food_type_ctg04=";
		$parameter .= $_REQUEST["food_type_ctg04"];
	}
	//검색어
	if(isset($_REQUEST["fd_mt_ctg01"])){
		$parameter .= "&fd_mt_ctg01=";
		$parameter .= $_REQUEST["fd_mt_ctg01"];
	}
	//검색어
	if(isset($_REQUEST["fd_mt_ctg02"])){
		$parameter .= "&fd_mt_ctg02=";
		$parameter .= $_REQUEST["fd_mt_ctg02"];
	}
	//검색어
	if(isset($_REQUEST["ck_ry_ctg01"])){
		$parameter .= "&ck_ry_ctg01=";
		$parameter .= $_REQUEST["ck_ry_ctg01"];
	}
	//검색어
	if(isset($_REQUEST["ck_ry_ctg02"])){
		$parameter .= "&ck_ry_ctg02=";
		$parameter .= $_REQUEST["ck_ry_ctg02"];
	}
	//검색어
	if(isset($_REQUEST["ck_ry_ctg03"])){
		$parameter .= "&ck_ry_ctg03=";
		$parameter .= $_REQUEST["ck_ry_ctg03"];
	}
	//검색어
	if(isset($_REQUEST["tema_ctg01"])){
		$parameter .= "&tema_ctg01=";
		$parameter .= $_REQUEST["tema_ctg01"];
	}
	//검색어
	if(isset($_REQUEST["order"])){
		$parameter .= "&order=";
		$parameter .= $_REQUEST["order"];
	}
	//검색어
	if(isset($_REQUEST["numOfRows"])){
		$parameter .= "&numOfRows=";
		$parameter .= $_REQUEST["numOfRows"];
	}

	$url = "http://api.nongsaro.go.kr/service" . $parameter;

	//XML Parsing
	$xml = file_get_contents($url);
	//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
	$object = simplexml_load_string($xml);
?>
	<form name="searchApiForm">
	<input type="hidden" name="pageNo" value="<?PHP if(isset($_REQUEST["pageNo"])){ echo $_REQUEST["pageNo"]; }?>">
	<input type="hidden" name="schType" value="<?=$schType?>">
	<input type="hidden" name="schText" value="<?=$schText?>">
	<input type="hidden" name="cntntsNo">

	<table width="100%" cellSpacing="0" cellPadding="0" border="1">
	<tr>
		<td align="center">
			<a href="#" onclick="fncTabChg('A');">  <?PHP if ( $schType == "A") {  echo "<strong>기본검색</strong>";  }else{  echo "기본검색";  } ?> </a>
		</td>
		<td align="center">
			<a href="#" onclick="fncTabChg('B');">  <?PHP if ( $schType == "B") {  echo "<strong>상세검색</strong>";  }else{  echo "상세검색";  } ?> </a>
		</td>
	</tr>
	</table>

	<table width="100%" cellSpacing="0" cellPadding="0" border="1">
		<colgroup>
			<col style="width:10%" />
			<col/>
		</colgroup>
		<tbody>
<?PHP
	if ( $schType == "A") {
?>
	<tr>
		<th>
			초성검색
		</th>
		<td>
			<div id="koreanSrch">
				<a href="#" onclick="fncContSearch('');return false;" style="font-weight:<?PHP if ( $schText == "") {  echo "bold";  } ?>">전체</a>&nbsp;
				<a href="#" onclick="fncContSearch('가');return false;" style="font-weight:<?PHP if ( $schText == "가") {  echo "bold";  } ?>">가</a>&nbsp;
				<a href="#" onclick="fncContSearch('나');return false;" style="font-weight:<?PHP if ( $schText == "나") {  echo "bold";  } ?>">나</a>&nbsp;
				<a href="#" onclick="fncContSearch('다');return false;" style="font-weight:<?PHP if ( $schText == "다") {  echo "bold";  } ?>">다</a>&nbsp;
				<a href="#" onclick="fncContSearch('라');return false;" style="font-weight:<?PHP if ( $schText == "라") {  echo "bold";  } ?>">라</a>&nbsp;
				<a href="#" onclick="fncContSearch('마');return false;" style="font-weight:<?PHP if ( $schText == "마") {  echo "bold";  } ?>">마</a>&nbsp;
				<a href="#" onclick="fncContSearch('바');return false;" style="font-weight:<?PHP if ( $schText == "바") {  echo "bold";  } ?>">바</a>&nbsp;
				<a href="#" onclick="fncContSearch('사');return false;" style="font-weight:<?PHP if ( $schText == "사") {  echo "bold";  } ?>">사</a>&nbsp;
				<a href="#" onclick="fncContSearch('아');return false;" style="font-weight:<?PHP if ( $schText == "아") {  echo "bold";  } ?>">아</a>&nbsp;
				<a href="#" onclick="fncContSearch('자');return false;" style="font-weight:<?PHP if ( $schText == "자") {  echo "bold";  } ?>">자</a>&nbsp;
				<a href="#" onclick="fncContSearch('차');return false;" style="font-weight:<?PHP if ( $schText == "차") {  echo "bold";  } ?>">차</a>&nbsp;
				<a href="#" onclick="fncContSearch('카');return false;" style="font-weight:<?PHP if ( $schText == "카") {  echo "bold";  } ?>">카</a>&nbsp;
				<a href="#" onclick="fncContSearch('타');return false;" style="font-weight:<?PHP if ( $schText == "타") {  echo "bold";  } ?>">타</a>&nbsp;
				<a href="#" onclick="fncContSearch('파');return false;" style="font-weight:<?PHP if ( $schText == "파") {  echo "bold";  } ?>">파</a>&nbsp;
				<a href="#" onclick="fncContSearch('하');return false;" style="font-weight:<?PHP if ( $schText == "하") {  echo "bold";  } ?>">하</a>
			</div>
		</td>
	</tr>
	<tr>
		<th>
			카테고리내 음식명
		</th>
		<td>
			<input type="text" name="schTrditfdNm" value="<?PHP if(isset($_REQUEST["schTrditfdNm"])){ echo $_REQUEST["schTrditfdNm"]; }?>">
			<input type="button" name="search" value="검색" onclick="return fncSearch();"/>
		</td>
	</tr>

<?PHP
	}else{
?>
	<tr>
			<th>음식명</th>
			<td>
				<input type="text" name="schTrditfdNm2" value="<?PHP if(isset($_REQUEST["schTrditfdNm2"])){ echo $_REQUEST["schTrditfdNm2"]; }?>">
				<input type="button" name="search" value="검색" onclick="return fncSearch();"/>
			</td>
		</tr>
		<tr>
			<th>지역</th>
			<td>
				<select name="sidoCode">
					<option value="">선택하세요</option>
<?PHP

				$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "doLst";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;
				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["sidoCode"])){ if($_REQUEST["sidoCode"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}
?>
			</select>
		    </td>

		</tr>
		<tr>
			<th>식품유형</th>
			<td>
				<select name="food_type_ctg01" onchange="fncTabChg('food_type_ctg01');">
					<option value="">선택하세요</option>
<?PHP
				$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "cmmCodeInfo";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;
				$parameter .= "&codeGroup=112";

				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["food_type_ctg01"])){ if($_REQUEST["food_type_ctg01"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}
?>
			</select>&nbsp;&nbsp;
			<select name="food_type_ctg02" onchange="fncTabChg('food_type_ctg02');">
				<option value="">선택하세요</option>
<?PHP
				$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "cmmCodeInfo";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;
				$parameter .= "&codeGroup=112";
				$parameter .= "&upperCode=".$_REQUEST["food_type_ctg01"];

				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["food_type_ctg02"])){ if($_REQUEST["food_type_ctg02"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}
?>
 			</select>
		    &nbsp;&nbsp;
				<select name="food_type_ctg03" onchange="fncTabChg('food_type_ctg03');">
					<option value="">선택하세요</option>

<?PHP
				$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "cmmCodeInfo";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;
				$parameter .= "&codeGroup=112";
				$parameter .= "&upperCode=".$_REQUEST["food_type_ctg02"];

				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["food_type_ctg03"])){ if($_REQUEST["food_type_ctg03"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}
?>
			</select>
		    &nbsp;&nbsp;
				<select name="food_type_ctg04" onchange="fncTabChg('food_type_ctg04');">
					<option value="">선택하세요</option>
<?PHP
			$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "cmmCodeInfo";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;
				$parameter .= "&codeGroup=112";
				$parameter .= "&upperCode=".$_REQUEST["food_type_ctg03"];

				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["food_type_ctg04"])){ if($_REQUEST["food_type_ctg04"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}
?>
			</select>
		    </td>

		</tr>
		<tr>
			<th>식재료</th>
			<td>
				<select name="fd_mt_ctg01" onchange="fncTabChg('fd_mt_ctg01');">
					<option value="">선택하세요</option>

<?PHP
				$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "fdMtLst";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;


				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["fd_mt_ctg01"])){ if($_REQUEST["fd_mt_ctg01"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}

?>
				</select>&nbsp;&nbsp;
				<select name="fd_mt_ctg02" onchange="fncTabChg('');">
					<option value="">선택하세요</option>
<?PHP
				$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "fdMtLst";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;
				$parameter .= "&code=".$_REQUEST["fd_mt_ctg01"];

				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["fd_mt_ctg02"])){ if($_REQUEST["fd_mt_ctg02"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}

?>
			  </select>
		    </td>

		</tr>
				<tr>
			<th>조리법</th>
			<td>
				<select name="ck_ry_ctg01" onchange="fncTabChg('ck_ry_ctg01');">
					<option value="">선택하세요</option>
<?PHP

				$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "cmmCodeInfo";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;
				$parameter .= "&codeGroup=115";

				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["ck_ry_ctg01"])){ if($_REQUEST["ck_ry_ctg01"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}
?>
				</select>&nbsp;&nbsp;
				<select name="ck_ry_ctg02" onchange="fncTabChg('ck_ry_ctg02');">
					<option value="">선택하세요</option>
<?PHP
				$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "cmmCodeInfo";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;
				$parameter .= "&codeGroup=115";
				$parameter .= "&upperCode=".$_REQUEST["ck_ry_ctg01"];

				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["ck_ry_ctg02"])){ if($_REQUEST["ck_ry_ctg02"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}
?>
				</select>
		   		&nbsp;&nbsp;
				<select name="ck_ry_ctg03" onchange="fncTabChg('');">
					<option value="">선택하세요</option>
<?PHP
				$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "cmmCodeInfo";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;
				$parameter .= "&codeGroup=115";
				$parameter .= "&upperCode=".$_REQUEST["ck_ry_ctg02"];

				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["ck_ry_ctg03"])){ if($_REQUEST["ck_ry_ctg03"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}
?>
			 </select>
		    </td>

		</tr>
		<tr>
			<th>테마</th>
			<td>
				<select name="tema_ctg01" onchange="fncTabChg('');">
					<option value="">선택하세요</option>
<?PHP
			$apiKey = "발급받은인증키를삽입하세요";
				//서비스 명
				$serviceName = "nvpcFdCkry";
				//오퍼레이션 명
				$operationName = "temaLst";

				//XML 받을 URL 생성
				$parameter = "/".$serviceName."/".$operationName;
				$parameter .= "?apiKey=".$apiKey;

				$url1 = "http://api.nongsaro.go.kr/service" . $parameter;

				//XML Parsing
				$xml1 = file_get_contents($url1);
				//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
				$object1 = simplexml_load_string($xml1);
				foreach($object1->body[0]->items[0]->item as $item){
					//키값
					$code = $item->code;
					//파일 다운로드 URL
					$codeNm = $item->codeNm;
?>
				<option value="<?=$code?>" <?PHP if(isset($_REQUEST["tema_ctg01"])){ if($_REQUEST["tema_ctg01"]== $code) echo "selected"; }?> ><?=$codeNm?></option>
<?PHP
				}
?>
			</select>
		    </td>

		</tr>
		<tr>
			<td colspan="2">
			정렬방식 :
			<select name="order" onchange="fncTabChg('');">
			<option value="DESC" <?PHP if(isset($_REQUEST["order"])){ if($_REQUEST["order"]== "DESC") echo "selected"; }?>>내림차순</option>
			<option value="ASC" <?PHP if(isset($_REQUEST["order"])){ if($_REQUEST["order"]== "ASC") echo "selected"; }?>>오름차순</option>
			</select>
			출력건수 :
			<select name="numOfRows" onchange="fncTabChg('');">
			<option value="10" <?PHP if(isset($_REQUEST["numOfRows"])){ if($_REQUEST["numOfRows"]== "10") echo "selected"; }?>>10</option>
			<option value="5" <?PHP if(isset($_REQUEST["numOfRows"])){ if($_REQUEST["numOfRows"]== "5") echo "selected"; }?>>5</option>
			</select>
			</td>
		</tr>
<?PHP
	}
?>
	</tbody>
	</table>
	</form>

<?PHP
	if(count($object->body[0]->items[0]->item) == 0){
?>
	<h3>조회한 정보가 없습니다.</h3>
<?PHP
	}else{
?>
	<hr>
	<table width="100%" border="1" cellSpacing="0" cellPadding="0">
		<colgroup>
			<col/>
			<col width="25%"/>
			<col width="25%"/>
			<col width="10%"/>
			<col width="10%"/>
		</colgroup>
		<tr>
			<th>이미지</th>
			<th>음식명</th>
			<th>조리법</th>
			<th>IPC</th>
			<th>고문헌</th>
		</tr>
<?PHP
		foreach($object->body[0]->items[0]->item as $item){
			//키값
			$cntntsNo = $item->cntntsNo;
			//파일구분코드
			$rtnImgSeCode = $item->rtnImgSeCode;
			//파일경로
			$rtnFileCours = $item->rtnFileCours;
			//파일명
			$rtnThumbFileNm = $item->rtnThumbFileNm;

			//음식명
			$trditfdNm = $item->trditfdNm;
			//음식유형 풀경로
			$foodTyCodeFullname = $item->foodTyCodeFullname;
			//지역명
			$atptCodeNm = $item->atptCodeNm;
			//조리법
			$ckryCodeFullname = $item->ckryCodeFullname;
			//IPC
			$clIpcCode = $item->clIpcCode;
			//IPC명
			$clIpcCodeNm = $item->clIpcCodeNm;
			//고문헌명
			$oldLtrtreNm = $item->oldLtrtreNm;
			//고문헌코드
			$oldLtrtreEsntlCode = $item->oldLtrtreEsntlCode;

			$imgCnt =-1;
			$rtnImgSeCodeArr = explode('|',$rtnImgSeCode);
			$rtnFileCoursArr = explode('|',$rtnFileCours);
			$rtnThumbFileNmArr = explode('|',$rtnThumbFileNm);
			$rtnImgSeCodeCnt = count($rtnImgSeCodeArr);
			for($k=0; $k < $rtnImgSeCodeCnt; $k++){
				if("209006" == $rtnImgSeCodeArr[$k]){
					$imgCnt = $k;
				}
			}
			$imgUrl ="http://www.nongsaro.go.kr/ps/img/common/anvil_img.jpg";
			if($imgCnt > -1){
				$imgUrl = "http://www.nongsaro.go.kr/"+ $rtnFileCoursArr[$imgCnt] +"/"+ $rtnThumbFileNmArr[$imgCnt];
			}else{
				for($j=0; $j < $rtnImgSeCodeCnt; $j++){
					if("209007" == $rtnImgSeCodeArr[$j]){
						$imgCnt = $j;
					}
				}
				if($imgCnt > -1){
					$imgUrl = "/"+ $rtnFileCoursArr[$imgCnt] +"/"+ $rtnThumbFileNmArr[$imgCnt];
				}
			}
?>
		<tr>
			<td>
			<a href="#" onclick="fncView('<?=$cntntsNo?>');">
			<img src="<?=$imgUrl?>" alt=""  title="" style="width: 249px;height: 198px;"/>
			</a>
			</td>
			<td align="center">
			<a href="#" onclick="fncView('<?=$cntntsNo?>');">
			<?=$trditfdNm?>
<?PHP
			if($foodTyCodeFullname != ""){
?>
				[<?=$foodTyCodeFullname?>]
<?PHP			}
			if($atptCodeNm  != ""){
?>
				[<?=$atptCodeNm?>]
<?PHP
			}else{
?>
				[상용]

<?PHP
			}
?>
			</a>
			</td>
			<td align="center"><?=$ckryCodeFullname?></td>
			<td align="center">
			<?PHP
			if(isset($clIpcCode)){
				$clIpcCodeArr = explode(', ',$clIpcCode);
				$clIpcCodeNmArr = explode(', ',$clIpcCodeNm);
				$clIpcCodeArrCnt = count($clIpcCodeArr);
				for($l=0;$l<$clIpcCodeArrCnt;$l++){
					if($l != 0){echo ",";}
			?>
				<a href="#" onclick="fncListOpen('1','<?=$clIpcCodeArr[$l]?>','<?=$clIpcCodeNmArr[$l]?>')"><?=$clIpcCodeNmArr[$l]?></a>
			<?PHP
				}
			}
			?>
			</td>
			<td align="center">
			<?PHP
			if(isset($oldLtrtreEsntlCode)){
				$oldLtrtreEsntlCodeArr= explode(', ',$oldLtrtreEsntlCode);
				$oldLtrtreNmArr= explode(', ',$oldLtrtreNm);
				$oldLtrtreEsntlCodeCnt = count($oldLtrtreEsntlCodeArr);
				for($m=0;$m<$oldLtrtreEsntlCodeCnt;$m++){
				if($m != 0){echo ",";}
			?>
				<a href="#" onclick="fncListOpen('2','<?=$oldLtrtreEsntlCodeArr[$m]?>','')"><?=$oldLtrtreNmArr[$m]?></a>
			<?PHP
				}
			}
			?>
			</td>
		</tr>
<?PHP
		}

?>
	</table>

<?PHP
}
	//페이징 처리
	//한 페이지에 제공할 건수
	$numOfRows = $object->body[0]->items[0]->numOfRows;
	//조회된 총 건수
	$totalCount = $object->body[0]->items[0]->totalCount;
	//조회할 페이지 번호
	$pageNo = $object->body[0]->items[0]->pageNo;

	$pageGroupSize = 10;
	$pageSize = 0;

	$pageSize = (int)$numOfRows;
	if($pageSize==0) $pageSize=10;

	$start = (int)$pageNo;
	if($start==0)$start=1;

	$currentPage = (int)$pageNo;

	$startRow = ($currentPage -1) * $pageSize +1;//한 페이지의 시작글 번호
	$endRow = $currentPage * $pageSize;//한 페이지의 마지막 글번호

	$count = (int)$totalCount;
	$number=0;

	$number=$count-($currentPage-1)*$pageSize;//글목록에 표시할 글번호

	//페이지그룹의 갯수
	//ex) pageGroupSize가 3일 경우 '[1][2][3]'가 pageGroupCount 개 만큼 있다.
	$pageGroupCount = $count/($pageSize*$pageGroupSize);

	//페이지 그룹 번호
	//ex) pageGroupSize가 3일 경우  '[1][2][3]'의 페이지그룹번호는 1 이고  '[2][3][4]'의 페이지그룹번호는 2 이다.
	$numPageGroup = (int)ceil((double)$currentPage/$pageGroupSize);

	if($count > 0){
		$pageCount = $count / $pageSize + ( $count % $pageSize == 0 ? 0 : 1);
		$startPage = $pageGroupSize*($numPageGroup-1)+1;
		$endPage = $startPage + $pageGroupSize-1;
		$startPnt = 0;

		if($endPage > $pageCount){
			$endPage = $pageCount;
		}

		if($numPageGroup > 1){
			$startPnt = ($numPageGroup-2)*$pageGroupSize+1;
			echo "<a href='javascript:fncGoPage(".$startPnt.");'>[이전]</a>";
		}

		for($i=$startPage; $i<=$endPage; $i++){
			$startPnt = $i;
			echo "<a href='javascript:fncGoPage(".$startPnt.");'>";

			if($currentPage == $i){
				echo "<strong>[$i]</strong>";
			}else{
				echo "[$i]";
			}
			echo "</a>";
		}

		if($numPageGroup < $pageGroupCount){
			$startPnt = ($numPageGroup*$pageGroupSize+1);
			echo "<a href='javascript:fncGoPage(".$startPnt.");'>[다음]</a>";
		}
	}
//페이징 처리 끝
?>
</body>
</html>